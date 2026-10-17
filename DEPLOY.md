# Déployer CaMI

CaMI est livrée sous forme d'**image Docker** (voir `Dockerfile`) : elle tourne chez n'importe
quel hébergeur qui accepte des conteneurs. Ce guide détaille l'hébergeur recommandé, **Google
Cloud Run à Johannesburg**, puis les points communs à tous les hébergeurs.

## Pourquoi Google Cloud Run (région `africa-south1`, Johannesburg)

- **Proche de la base de données** : le cluster MongoDB Atlas du projet est chez AWS au Cap
  (`af-south-1`). Johannesburg est à quelques millisecondes ; un hébergeur en Europe ou aux
  États-Unis ajouterait un aller-retour intercontinental à chaque synchro et à chaque page admin.
- **Docker natif**, **HTTPS automatique** (obligatoire pour la PWA et pour la connexion Google),
  redémarrage et mise à l'échelle gérés.
- **Facturation à l'usage avec un quota gratuit mensuel** : pour une ou quelques classes, le coût
  devrait rester très faible. Vérifie les tarifs à jour (la région de Johannesburg est en
  « Tier 2 », un peu plus chère) : <https://cloud.google.com/run/pricing>.
- Compromis : sans trafic, le conteneur s'arrête ; la première visite après une pause attend
  quelques secondes (« démarrage à froid »). `--min-instances 1` supprime ce délai, mais le
  conteneur est alors facturé en continu.

Alternatives si les élèves sont surtout en Europe : un PaaS Docker européen (Scaleway Serverless
Containers à Paris, Koyeb à Francfort, Railway…) — dans ce cas, déplace aussi le cluster Atlas en
Europe, sinon chaque accès à la base fera l'aller-retour vers l'Afrique du Sud.

## 0. Tester l'image sur ta machine

```bash
cp .env.docker.example .env.docker   # puis remplis les valeurs (mêmes que .env.local)
docker compose up -d --build
# → http://localhost:3100   (contrôle : http://localhost:3100/api/health)
docker compose logs -f cami          # journaux
docker compose down                  # arrêter
```

## 1. Préparer Google Cloud (une seule fois)

Prérequis : un compte Google Cloud avec la facturation activée, et la CLI `gcloud`
(<https://cloud.google.com/sdk/docs/install>).

```bash
gcloud auth login
gcloud projects create cami-prod --name="CaMI"        # ou un projet existant
gcloud config set project cami-prod
gcloud config set run/region africa-south1

gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com

# Dépôt d'images Docker, dans la même région
gcloud artifacts repositories create cami --repository-format=docker --location=africa-south1
```

### Les secrets (Secret Manager)

Jamais dans l'image ni dans la ligne de commande en clair : on les range dans Secret Manager.

```bash
printf '%s' 'mongodb+srv://…'         | gcloud secrets create cami-mongodb-uri   --data-file=-
printf '%s' "$(openssl rand -base64 32)" | gcloud secrets create cami-auth-secret --data-file=-
printf '%s' 'GOCSPX-…'                | gcloud secrets create cami-google-secret --data-file=-
```

> `openssl rand -base64 32` génère une nouvelle clé aléatoire ; tu peux aussi réutiliser celle de
> ton `.env.local`. Garde ensuite **toujours la même** en production : la changer déconnecte tout
> le monde.

Autorise le compte de service de Cloud Run à lire ces secrets :

```bash
PROJECT_NUMBER=$(gcloud projects describe cami-prod --format='value(projectNumber)')
for s in cami-mongodb-uri cami-auth-secret cami-google-secret; do
  gcloud secrets add-iam-policy-binding $s \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role=roles/secretmanager.secretAccessor
done
```

## 2. Construire et publier l'image

Cloud Build construit l'image dans le cloud à partir du `Dockerfile` (rien à installer chez toi) :

```bash
gcloud builds submit --tag africa-south1-docker.pkg.dev/cami-prod/cami/cami:latest
```

## 3. Déployer

```bash
gcloud run deploy cami \
  --image africa-south1-docker.pkg.dev/cami-prod/cami/cami:latest \
  --region africa-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances 3 \
  --set-env-vars "MONGODB_DB=cami,AUTH_GOOGLE_ID=630606268259-….apps.googleusercontent.com" \
  --set-secrets "MONGODB_URI=cami-mongodb-uri:latest,AUTH_SECRET=cami-auth-secret:latest,AUTH_GOOGLE_SECRET=cami-google-secret:latest"
```

La commande affiche l'adresse publique, du type `https://cami-xxxxxxxx.africa-south1.run.app`.
Contrôle : `https://…/api/health` doit répondre `{"status":"ok"}`.

## 4. Brancher les services externes sur cette adresse

1. **Google OAuth** (Google Cloud Console → APIs & Services → Credentials → ton client OAuth) :
   ajoute dans *Authorized redirect URIs* :
   `https://<ton-adresse>/api/auth/callback/google`.
2. **Écran de consentement OAuth** : en mode « Testing », seuls les « Test users » listés
   peuvent se connecter (100 maximum). Pour ouvrir l'app à tes élèves, clique sur **Publish
   app**. Les seules données demandées (nom, email, photo) ne nécessitent pas de validation par
   Google.
3. **MongoDB Atlas → Network Access** : Cloud Run sort sur Internet avec des adresses IP qui
   changent ; il faut donc autoriser `0.0.0.0/0`. La base reste protégée par l'utilisateur et son
   mot de passe — **utilise un mot de passe long et unique** (régénère celui qui a circulé pendant
   le développement). Pour une IP fixe autorisée seule, il faut un Cloud NAT (payant).

## 5. Mettre à jour l'app

```bash
gcloud builds submit --tag africa-south1-docker.pkg.dev/cami-prod/cami/cami:latest
gcloud run deploy cami --image africa-south1-docker.pkg.dev/cami-prod/cami/cami:latest --region africa-south1
```

Les variables et secrets sont conservés d'un déploiement à l'autre. Les appareils où l'app est
installée (PWA) récupèrent la nouvelle version à la visite suivante.

## Nom de domaine personnalisé (optionnel)

L'adresse `*.run.app` fonctionne telle quelle (HTTPS compris). Pour un domaine à toi, regarde la
documentation Cloud Run « Mapping custom domains » : selon la région, le mappage direct n'est pas
toujours disponible, et il faut alors passer par un équilibreur de charge ou Firebase Hosting.
Pense à ajouter la nouvelle URL de callback dans Google OAuth.

## Render

Le dépôt contient un Blueprint, `render.yaml` : Docker, région Francfort, offre gratuite, contrôle
de santé sur `/api/health`, déploiement automatique à chaque commit sur `main`.

1. Sur <https://dashboard.render.com> : **New → Blueprint**, connecte GitHub et choisis le dépôt.
2. Render affiche le service `cami` et demande les deux secrets :
   - `MONGODB_URI` : la chaîne de connexion Atlas (la forme `mongodb+srv://…` fonctionne sur
     Render) ;
   - `AUTH_GOOGLE_SECRET` : le secret du client OAuth (`GOCSPX-…`).
   `AUTH_SECRET` est généré par Render ; `MONGODB_DB` et `AUTH_GOOGLE_ID` sont dans le fichier.
3. **Apply**. Le premier build Docker prend quelques minutes. L'adresse publique ressemble à
   `https://cami-xxxx.onrender.com` ; contrôle : `https://…/api/health` → `{"status":"ok"}`.
4. Puis la section 4 ci-dessus : URL de callback Google
   (`https://cami-xxxx.onrender.com/api/auth/callback/google`), publication de l'écran de
   consentement, `0.0.0.0/0` dans Atlas → Network Access.

À savoir :
- **Mise en veille** (offre gratuite) : après 15 minutes sans visite, le service s'endort et le
  réveil prend environ une minute. L'app installée (PWA) s'ouvre quand même depuis son cache
  après 5 secondes, mais la connexion et la synchro attendent le réveil. Une offre payante
  supprime la veille.
- **Distance avec la base** : Render n'a pas de région en Afrique ; chaque accès à MongoDB fait
  l'aller-retour Francfort ↔ Le Cap. Pour l'éviter, recrée le cluster Atlas en Europe (Francfort,
  `eu-central-1`) — la région d'un cluster ne se change pas après coup.
- La région d'un service Render ne peut pas être modifiée après sa création.

## Chez un autre hébergeur Docker

Ce qu'il faut, partout :

| Réglage | Valeur |
| --- | --- |
| Image | construite depuis le `Dockerfile` (argument de build `CAMI_CLOUD_ENABLED=true` par défaut) |
| Port | 3000, ou celui imposé par l'hébergeur via la variable `PORT` |
| Variables | `MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Santé | `GET /api/health` → `{"status":"ok"}` (ne dépend pas de MongoDB) |
| HTTPS | obligatoire (PWA + connexion Google) — fourni par la plupart des hébergeurs |

`AUTH_TRUST_HOST=true` est déjà défini dans l'image. Ensuite, mêmes étapes que la section 4 :
URL de callback Google, publication de l'écran de consentement, accès réseau Atlas.

Pour une version **sans comptes** (tout reste dans le navigateur de chaque élève), construis avec
`docker build --build-arg CAMI_CLOUD_ENABLED=false -t cami .` : aucune variable n'est alors
nécessaire.
