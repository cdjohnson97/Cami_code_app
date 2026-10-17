# CaMI — apprendre à coder, puis apprivoiser l'IA

CaMI est un parcours interactif en français pour apprendre l'algorithmique, Python, puis
construire ses premières intelligences artificielles pas à pas. L'app inclut un interpréteur
Python/pseudocode maison (pas d'exécution côté serveur — tout tourne dans le navigateur),
109 exercices corrigés automatiquement, un système de badges, des animations et un mascotte
compagnon de route.

Construit avec **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4** et
**Framer Motion**. Par défaut, la progression est sauvegardée en local (localStorage) — pas de
backend requis. Un backend **optionnel (MongoDB + connexion Google via Auth.js)** peut être
activé pour deux choses : des comptes avec synchronisation multi-appareils de la progression et
des préférences, et un tableau de bord pour suivre un groupe d'apprenant·es (voir plus bas).

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000).

## Build de production

```bash
npm run build
npm start
```

Le build est 100% autonome : les polices (Fraunces, Karla, JetBrains Mono) sont auto-hébergées
via `@fontsource` — aucune requête réseau n'est nécessaire au build, ça fonctionne même
derrière un pare-feu strict ou hors-ligne.

## Backend (optionnel) — comptes, synchronisation et suivi de groupe

Sans rien configurer, l'app fonctionne très bien telle quelle : chaque appareil garde sa
progression en localStorage. Pour ajouter des comptes (connexion avec Google) avec
synchronisation de la progression et des préférences entre appareils, plus un tableau de bord
admin pour suivre la progression d'un groupe, active le backend :

1. **Base de données — MongoDB Atlas** (offre gratuite M0, sans carte bancaire) :
   - Crée un cluster sur [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - **Database Access** : crée un utilisateur avec mot de passe.
   - **Network Access** : autorise ton IP (ou `0.0.0.0/0` si l'app est déployée sur Vercel,
     dont les IP changent).
   - **Connect → Drivers** : copie la chaîne de connexion
     (`mongodb+srv://utilisateur:motdepasse@cluster…mongodb.net/`).
   - Aucune table ni schéma à créer : les collections apparaissent toutes seules au premier
     login.
2. **Connexion Google** — dans la [Google Cloud Console](https://console.cloud.google.com/) :
   - **APIs & Services → OAuth consent screen** : configure l'écran de consentement (type
     « External »).
   - **APIs & Services → Credentials → Create credentials → OAuth client ID**, type « Web
     application ».
   - **Authorized redirect URIs** : ajoute
     `http://localhost:3000/api/auth/callback/google` (et plus tard
     `https://ton-domaine/api/auth/callback/google` pour la production).
   - Récupère le **Client ID** et le **Client secret**.
3. À la racine du projet, copie `.env.local.example` en `.env.local` et renseigne :
   ```
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB=cami
   AUTH_SECRET=...            # génère-la avec : npx auth secret
   AUTH_GOOGLE_ID=....apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=...
   ```
4. Redémarre `npm run dev` (ou redéploie si c'est déjà en ligne). Une carte "Compte" apparaît
   alors dans **Réglages**, avec un bouton « Se connecter avec Google ».
5. **Pour te donner accès au tableau de bord admin** (`/admin`, qui liste tous les comptes et
   leur progression) : connecte-toi une première fois depuis l'app avec le compte Google que tu
   veux utiliser comme admin, puis dans Atlas → **Browse Collections** (ou `mongosh`), passe le
   champ `role` de ce compte à `"admin"` dans la collection `users` :
   ```js
   db.users.updateOne({ email: "ton-email@gmail.com" }, { $set: { role: "admin" } })
   ```
   Le lien "Tableau de bord admin" apparaît ensuite dans Réglages (après un rechargement) une
   fois connecté avec ce compte, et la page `/admin` refuse l'accès à tout le monde d'autre.
   Le tableau de bord montre :
   - un résumé (nombre de comptes, progression moyenne, parcours terminés) ;
   - **les exercices où ça bloque** : commencés sans être réussis par le plus d'élèves, ou
     réussis après beaucoup d'essais ratés ;
   - la liste des élèves. Un clic sur un nom ouvre **son détail** : l'état de chaque exercice
     (réussi du premier coup / après N essais, en cours, pas commencé) et son code.

> **Erreur `querySrv ECONNREFUSED` ?** Node n'arrive pas à faire la résolution DNS SRV qu'exige
> une adresse `mongodb+srv://` (vu sous Windows avec Node 24 : Node ne trouve pas le DNS système
> et interroge `127.0.0.1`). Utilise alors la forme standard `mongodb://hôte1,hôte2,hôte3/?ssl=true&replicaSet=…&authSource=admin`.
> Atlas la donne aussi (Connect → Drivers → choisir une ancienne version du driver).

Ce qui est stocké dans MongoDB (base `cami` par défaut) :

| Collection    | Contenu                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `users`       | Comptes (nom, email, photo Google) + `role` (`"admin"`, sinon élève)     |
| `accounts`    | Lien compte ↔ Google (géré par Auth.js)                                   |
| `progress`    | Un document par élève : exercices réussis, code, badges, série, etc.     |
| `preferences` | Un document par élève : prénom, thème, son, langage du bac à sable        |

Sans ces variables d'environnement (il les faut **toutes**), tout ce qui touche aux comptes
reste invisible dans l'interface (pas de carte "Compte" en Réglages), et `/admin` affiche
simplement un message expliquant que le backend n'est pas configuré — rien ne casse.

## Déployer

- **Vercel** (recommandé, zéro configuration) : `npx vercel`, ou connecte le dossier à un
  nouveau projet sur [vercel.com](https://vercel.com/new).
- **Netlify** : connecte le dossier, build command `npm run build`, publish directory `.next`
  (avec le plugin Next.js officiel de Netlify).
- **GitHub** : `git init`, `git add -A`, `git commit -m "Initial commit"`, puis pousse vers un
  nouveau dépôt — les plateformes ci-dessus peuvent se brancher directement dessus.

Si tu as activé le backend, ajoute les mêmes variables d'environnement (`MONGODB_URI`,
`MONGODB_DB`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) dans les réglages du projet
côté Vercel/Netlify, **puis relance un build** : l'activation du backend est décidée au moment
du build. Pense aussi à ajouter l'URL de callback de production
(`https://ton-domaine/api/auth/callback/google`) dans la Google Cloud Console. Hors Vercel
(et aussi pour tester `npm start` en local), ajoute `AUTH_TRUST_HOST=true`, sinon la connexion
échoue avec l'erreur `UntrustedHost`.

## Structure du projet

```
src/
  auth.ts               Configuration Auth.js (Google + adaptateur MongoDB, sessions JWT)
  app/                  Layout racine, polices, styles globaux, page 404
    (parcours)/         L'app d'apprentissage et ses URL (/carte, /chapitre/…)
    admin/              Tableau de bord admin (backend requis)
    api/auth/[...nextauth]/  Endpoints Auth.js (connexion/déconnexion Google, session)
    api/me/             Lecture (GET) / sauvegarde (PUT) de la progression et des préférences
  components/           Toute l'interface (accueil, chapitres, carte, glossaire, sidebar…)
    CloudSync.tsx        Synchronisation avec le serveur (session + push/pull)
    AccountCard.tsx       Carte "Compte" dans Réglages (connexion Google, statut de synchro)
  lib/
    algoEngineCore.js    L'interpréteur pseudocode/Python (tokenizer + parser + interprète)
    algoEngine.ts         Wrapper TypeScript autour de l'interpréteur
    curriculum.ts         Les 4 parties, chapitres, 109 exercices + correcteurs, glossaire
    progress.ts           Logique de progression, déblocage des chapitres, badges
    highlight.ts           Coloration syntaxique (pseudocode / Python)
    partMeta.ts            Icônes, couleurs et description de chacune des 4 parties
    routes.ts              Les URL de l'app (/carte, /bac-a-sable, /chapitre/<id>…) et leurs titres
    pwa.ts                 Service worker (enregistrement) et état d'installation de l'app
    cloud/                 Backend : client MongoDB, données synchronisées + validation, flag
  store/
    useAppStore.ts        État global (Zustand), persistance localStorage
    useAuthStore.ts        État de connexion (miroir léger de la session Auth.js)
```

## Ce qui a changé par rapport à la version précédente (fichier unique)

- **Page d'accueil et présentation des 4 parties refaites** : nouveau style, et surtout —
  la Partie 4 ("IA") ne parle plus de "syntaxe Python" mais bien d'intelligence artificielle,
  avec une description et une couleur qui lui sont propres (`src/lib/partMeta.ts`).
- **Animations Framer Motion** : révélations en cascade sur l'accueil, mascotte animée
  (respiration, clin d'œil, bras qui se lève, bulle de dialogue au clic), barres de
  progression animées, transitions de page.
- **Animation de "voyage" à chaque changement de chapitre** : quand tu passes d'un chapitre
  à un autre, la mascotte traverse l'écran avant d'arriver au nouveau chapitre
  (`src/components/ChapterTravelOverlay.tsx`).
- **109 exercices et le moteur d'exécution portés à l'identique** (extraits programmatiquement
  de l'ancienne version, puis revalidés un par un — aucune régression).

### Simplifications assumées (pistes pour la suite)

Pour garder le périmètre de cette réécriture maîtrisable, deux fonctionnalités secondaires de
l'ancienne version n'ont pas été reportées : le mode "pas à pas" (débogueur ligne par ligne)
et le "mode révision". Elles peuvent être ajoutées par la suite si tu en as besoin.

### Éditeur de code

- **Suggestions comme dans VS Code** : mots-clés, blocs prêts à remplir (`SI … ALORS …
  FINSI`, `for i in range():`…), fonctions intégrées, méthodes après un `.` et noms déjà
  utilisés dans le code. Elles s'ouvrent en tapant ; ↑/↓ pour choisir, Entrée ou Tab pour
  valider, Échap pour fermer, Ctrl+Espace pour les afficher à la demande.
- **Erreurs en temps réel** : une demi-seconde après la dernière frappe, la ligne fautive est
  soulignée et le message s'affiche sous l'éditeur. Un clic sur le message place le curseur sur
  la ligne.
- **Barre de symboles** en bas de l'éditeur, sous le code (pratique sur téléphone et sur clavier AZERTY) :
  `( : " = == != < > [ { + - * / % , . _ #`… selon le langage, plus `⇥` pour indenter.
  `(`, `[`, `{` et `"` insèrent la paire avec le curseur au milieu, ou entourent la sélection.
  Ctrl+Z annule l'insertion.

### Application installable (PWA)

CaMI s'installe comme une application, sur téléphone comme sur ordinateur : icône sur l'écran
d'accueil, plein écran, et **fonctionnement hors-ligne** (le cours, l'éditeur et l'interpréteur
tournent dans le navigateur ; seules la connexion Google et la synchro ont besoin du réseau).

- Android / Chrome / Edge : un bandeau « Installe CaMI » apparaît sur téléphone, et Réglages →
  Application propose un bouton « Installer l'application ».
- iPhone / iPad : Réglages (et le bandeau) expliquent la marche à suivre : Partager → « Sur
  l'écran d'accueil ».
- L'installation exige **HTTPS** en production (c'est automatique sur Vercel/Netlify) ;
  `localhost` est accepté pour les essais.
- Le hors-ligne (service worker, `/sw.js`) n'est actif qu'avec un build de production
  (`npm run build && npm start`), pas avec `npm run dev`.
