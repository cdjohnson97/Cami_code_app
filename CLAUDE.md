# Notes de passation — CaMI (Next.js)

Ce fichier est destiné à toi, l'agent qui reprend ce projet (Claude Code ou autre). Il résume
le contexte, les décisions prises et les pièges déjà rencontrés, pour éviter de reproduire des
erreurs déjà corrigées ou de refaire un travail déjà fait. Lis-le avant de modifier quoi que ce
soit. Le `README.md` complète ce fichier côté "utilisateur" (installation, déploiement,
activation du backend) — les deux sont à jour au moment de la rédaction.

## Contexte

CaMI est une appli pédagogique en français (algorithmique → Python → mini-IA, 109 exercices
corrigés automatiquement par un interpréteur maison). Ce projet Next.js est une **réécriture
complète** d'une version précédente qui tenait dans un unique fichier HTML (un Claude
Artifact). Cette réécriture a été motivée par deux demandes de l'utilisateur, dans l'ordre :

1. Refaire la page d'accueil et la présentation des 4 parties du parcours (un bug faisait
   apparaître "syntaxe Python" comme description de la Partie 4, qui parle en réalité
   d'intelligence artificielle), ajouter des animations (Framer Motion) et une animation de
   "voyage" de la mascotte à chaque changement de chapitre.
2. Après un premier échange, l'utilisateur a demandé la réécriture complète en React/Next.js
   plutôt qu'un fichier unique, jugé "trop risqué et mal organisé". Livraison en fichiers
   source téléchargeables (zip), pas de déploiement géré par l'agent.
3. Plus tard : ajout d'un backend optionnel (Supabase) pour comptes + synchronisation
   multi-appareils + tableau de bord de suivi de groupe.
4. Ensuite (2026-10-11) : l'utilisateur a demandé du **NoSQL**. Supabase a été **entièrement
   retiré** et remplacé par **MongoDB (Atlas) + Auth.js (next-auth v5) avec connexion Google
   uniquement**. Choix explicite de l'utilisateur parmi Firebase / MongoDB+Auth.js / garder
   Supabase. Plus aucune trace de Supabase dans le code — n'en réintroduis pas.

## Ce qui a été vérifié et marche (au moment de la rédaction)

- `npx tsc --noEmit` : aucune erreur.
- `npm run build` : build de production propre, **sans dépendance réseau** (polices
  auto-hébergées via `@fontsource`, voir plus bas) — testé à la fois avec et sans backend
  Supabase configuré.
- Installation + build à froid depuis un zip du projet (sans `node_modules`/`.next`) : OK.
- Tests fonctionnels via navigateur automatisé (Playwright) : accueil, navigation complète
  (carte, glossaire, stats, sandbox, certificat, badges, réglages), résolution d'un exercice de
  bout en bout via le moteur porté (badges + confettis + toasts), responsive mobile, thème.
  Deux vrais bugs ont été trouvés et corrigés de cette façon (voir "Pièges déjà rencontrés").
- Backend MongoDB : voir la section « Backend MongoDB + Auth.js » plus bas pour ce qui a été
  testé et ce qui ne l'a pas été.

## Ce qui n'a PAS pu être vérifié ici

- Le **vrai aller-retour OAuth avec Google** (écran de consentement → callback) n'a jamais été
  fait : il faut de vrais identifiants Google Cloud. Ce qui a été testé, c'est tout le reste
  avec un cookie de session forgé (voir la section backend).
- Aucun test contre un **vrai cluster Atlas** (testé contre un conteneur Docker `mongo:7`
  local : même protocole, même driver).

## Architecture — vue d'ensemble

```
src/
  app/
    layout.tsx          Police (auto-hébergées, voir plus bas), métadonnées
    (parcours)/layout.tsx       Monte l'app une fois (ClientApp → AppShell, ssr:false)
    (parcours)/[[...slug]]/page.tsx   Pages valides + titres (rend null) — voir « URL et navigation »
    not-found.tsx         404 en français
    admin/page.tsx        Tableau de bord admin — Server Component, lit MongoDB directement :
                           résumé + « Exercices où ça bloque » + tableau des élèves
    admin/eleve/[id]/page.tsx   Détail d'un élève : statut de chaque exercice + son code
    admin/access.ts       Contrôle d'accès commun à toutes les pages admin (rôle relu en base)
    admin/ui.tsx          Composants partagés des pages admin (Shell, Message, tableaux…)
    api/auth/[...nextauth]/route.ts   Endpoints Auth.js (404 si backend non configuré)
    api/me/route.ts        GET/PUT de la progression + préférences de l'utilisateur connecté
  auth.ts                 Config Auth.js : Google + MongoDBAdapter, sessions JWT
  components/
    AppShell.tsx          Orchestration : hydratation, thème, vue affichée selon l'URL (une
                           seule arborescence client ; `route` du store suit l'URL)
    AppLink.tsx           Vrai lien <a href> vers une vue, navigation sur place au clic
    CloudSync.tsx          Toute la logique de synchro (session + pull/push via /api/me)
    AccountCard.tsx         UI de connexion Google / déconnexion dans Réglages
    Mascot.tsx               Personnage SVG animé (Framer Motion)
    ChapterTravelOverlay.tsx  Animation de "voyage" entre deux chapitres
    ExerciseCard.tsx          Boucle d'interaction d'un exercice (éditeur, vérif, indices…)
    CodeEditor.tsx            Éditeur (textarea + coloration) avec suggestions et erreurs en
                              direct — logique dans lib/completions.ts et lib/diagnostics.ts
    [Home|Chapter|JourneyMap|Glossary|Stats|Sandbox|Certificate|Badges|Settings]Page.tsx
                              Une "page" par vue logique, rendues conditionnellement par
                              AppShell selon `route.view` (PAS de vrais fichiers app/*/page.tsx
                              pour celles-ci — c'est un choix délibéré, voir plus bas)
  lib/
    algoEngineCore.js      L'interpréteur pseudocode/Python — copié OCTET PAR OCTET depuis
                            l'ancienne version (voir "Porting" plus bas). Ne PAS retaper à la
                            main si tu dois le modifier un jour : risque de régression sur les
                            109 exercices.
    algoEngine.ts            Wrapper TS au-dessus (types seulement, zéro logique)
    curriculum.ts             Les 4 parties + 109 exercices + correcteurs + glossaire — aussi
                              porté verbatim. `// @ts-nocheck` en tête (voir plus bas pourquoi).
    progress.ts                Logique pure (déblocage, badges, comptage) — réécrite à la main
                                depuis l'ancienne version (pas extraite), mais testée.
    highlight.ts                 Coloration syntaxique (tokenizer maison, porté verbatim)
    partMeta.ts                   Icône/couleur/texte de chacune des 4 parties — LE fix direct
                                  du bug "Partie 4 = Python" signalé par l'utilisateur.
    cloud/config.ts                `cloudEnabled` (booléen injecté au build par next.config.ts)
    cloud/shape.ts                  Quelles clés d'AppState vont dans `progress` / `preferences`
                                    + validation serveur de chaque champ
    cloud/mongo.ts                  Client MongoDB (singleton sur globalThis) + collections typées
    adminStats.ts                   Calculs purs du tableau de bord (statut d'un exercice,
                                    stats par exercice, classement « où ça bloque »)
  store/
    useAppStore.ts          Tout l'état applicatif (Zustand + persist middleware → localStorage
                             uniquement, `skipHydration: true` + rehydrate manuel dans
                             AppShell — voir pièges pour une race condition déjà corrigée)
    useAuthStore.ts           Miroir de la session Auth.js + `isAdmin` (PAS persisté)
next.config.ts             Calcule CAMI_CLOUD_ENABLED à partir des variables serveur
```

Il n'y a plus de `proxy.ts` : il ne servait qu'à rafraîchir le cookie Supabase. Auth.js en
sessions JWT n'en a pas besoin (le cookie est ré-émis à chaque appel de `/api/auth/session`).

### URL et navigation (refait le 2026-10-15)

Chaque vue a désormais sa **vraie URL** : `/`, `/carte`, `/glossaire`, `/stats`,
`/bac-a-sable`, `/certificat`, `/badges`, `/reglages`, `/chapitre/<id>`. Ça corrige un problème
signalé comme majeur par l'utilisateur : avant, le bouton Retour ne marchait pas et on ne pouvait
ni partager ni mettre en favori une page. L'app reste malgré tout **une seule arborescence
client, montée une fois** ; c'est l'URL qui choisit la vue :

- `lib/routes.ts` : **source unique** des URL (chemin ↔ route, titre d'onglet, liste de toutes
  les pages). Pour ajouter une vue, ajoute-la là, puis dans le rendu conditionnel d'`AppShell`.
- `app/(parcours)/layout.tsx` monte l'app (`ClientApp` → `AppShell`, `ssr:false`). Elle est dans
  le **layout** et non dans la page parce qu'un layout n'est pas recréé quand seul le
  `[[...slug]]` change : le store, les animations et le « voyage » entre chapitres survivent à la
  navigation.
- `app/(parcours)/[[...slug]]/page.tsx` ne rend rien. Il déclare les pages valides
  (`generateStaticParams` + `dynamicParams = false` : 36 pages pré-rendues, tout le reste →
  404 via `app/not-found.tsx`) et leur `<title>`.
- Navigation : `goTo()` fait un `window.history.pushState` natif (intégré au routeur Next,
  `usePathname` suit, aucun aller-retour serveur) puis `syncRoute()`. Retour/Avancer : `AppShell`
  observe `usePathname` et appelle `syncRoute`, qui déclenche aussi l'animation de voyage.
- Liens : `components/AppLink.tsx` produit un vrai `<a href>` (Ctrl+clic → nouvel onglet,
  copier le lien), avec navigation sur place au clic simple. Barre latérale, carte et
  précédent/suivant l'utilisent. Les boutons d'action (« Continuer le parcours »…) appellent
  encore `goTo` directement.
- `/admin` et `/api/*` restent des routes à part (rendu serveur, cookies).

## Porting depuis l'ancienne version (fichier unique)

`algoEngineCore.js`, la majeure partie de `curriculum.ts` et `highlight.ts` n'ont pas été
retapés à la main : ils ont été extraits programmatiquement de l'ancien fichier HTML (recherche
de marqueurs de début/fin dans le code source concaténé des balises `<script>`) puis collés
tels quels. Objectif : zéro régression sur les 109 exercices et leurs correcteurs, qui étaient
déjà testés un par un dans l'ancienne version. Une suite de validation (154 vérifications :
77 exercices × échec-attendu-sur-le-starter + réussite-attendue-sur-la-solution) a confirmé
l'absence de régression au moment du porting — elle n'est pas incluse dans ce zip (c'était un
script Node jetable), mais si tu dois re-porter quelque chose depuis l'ancienne version,
reproduis ce genre de garde-fou plutôt que de faire confiance à une relecture visuelle.

`curriculum.ts` garde `// @ts-nocheck` en tête pour cette raison : c'est du JS dynamique déjà
testé, où un typage strict complet coûterait cher pour peu de valeur. Les exports
(`CURRICULUM`, `GLOSSARY`, `MAP_ICONS`) sont recastés explicitement en types propres
(`Curriculum`, `GlossaryEntry[]`, `Record<string,string>`) juste avant l'export, pour que les
fichiers *consommateurs* (eux, en mode strict) aient un typage correct malgré le
`@ts-nocheck` du fichier source — sans ce recast, TS infère `any` en cascade dans tous les
fichiers qui importent `CURRICULUM`.

## Pièges déjà rencontrés (pour ne pas les reproduire)

- **Police Google Fonts et build hors-ligne** : `next/font/google` fait une requête réseau à
  `fonts.googleapis.com` *pendant le build*. Dans un environnement sans accès à ce domaine
  (pare-feu d'entreprise, CI restreinte, l'environnement où ce projet a été écrit…), le build
  échoue purement et simplement. Remplacé par des paquets `@fontsource/*` (police auto-hébergée,
  importée comme CSS normal dans `layout.tsx`) — le build ne dépend plus d'aucun réseau. Si tu
  ajoutes une police, fais pareil plutôt que de revenir à `next/font/google`.
- **`middleware.ts` déprécié en Next 16** au profit de `proxy.ts` (export nommé `proxy` au lieu
  de `middleware`). Le projet n'en a plus besoin (voir architecture) ; si un jour il en faut un,
  crée un `proxy.ts`, pas un `middleware.ts`.
- **`@auth/mongodb-adapter` exige `mongodb@^6`** (peer dependency). Ne monte pas le driver en
  v7 tant que l'adaptateur ne le supporte pas.
- **`next-auth` est en v5 bêta** (`5.0.0-beta.32`, épinglé en version exacte). C'est la seule
  ligne compatible App Router / Next 16. Lis le changelog avant de changer de version.
- **`querySrv ECONNREFUSED` avec `mongodb+srv://`** : sur la machine de l'utilisateur
  (Windows, Node 24, partage de connexion iPhone), `dns.getServers()` renvoie `127.0.0.1` au
  lieu du DNS système, donc la résolution SRV échoue alors que `nslookup` fonctionne. Le
  `.env.local` utilise donc la forme standard `mongodb://` (3 hôtes + `replicaSet` +
  `authSource`, récupérés via les enregistrements SRV/TXT). Si Atlas change la topologie du
  cluster, ces hôtes sont à mettre à jour.
- **`UntrustedHost` en production hors Vercel** : avec `next start`, Auth.js répond 500 sur
  `/api/auth/*` tant que `AUTH_TRUST_HOST=true` n'est pas défini (vérifié). En `next dev` et
  sur Vercel, ce n'est pas nécessaire.
- **Types générés obsolètes dans `.next/`** : après suppression d'une route, `tsc` peut
  échouer sur `.next/dev/types/validator.ts` qui la référence encore. Supprime
  `.next/dev/types` (régénéré automatiquement), ce n'est pas un vrai bug.
- **Lint préexistant** : `npx eslint .` remonte des erreurs dans des fichiers jamais touchés
  par la migration MongoDB (`ChapterPage`, `ChapterTravelOverlay`, `JourneyMapPage`,
  `NotificationCenter`, `@ts-nocheck` d'`algoEngine.ts`/`curriculum.ts`, `algoEngineCore.js`).
  Next 16 ne lance plus ESLint pendant `next build`, donc le build passe quand même.
- **Race condition d'hydratation Zustand** : `useAppStore.persist.rehydrate()` est asynchrone ;
  appeler `setHydrated()` juste après sans attendre la fin du rehydrate faisait brièvement
  réapparaître la modale "Bienvenue" pour un·e utilisateur·rice déjà connu·e (état par défaut
  affiché avant que le vrai état persisté n'arrive). Fix dans `AppShell.tsx` :
  `Promise.resolve(useAppStore.persist.rehydrate()).finally(() => setHydrated())`.
- **Ne rien écrire dans le store avant `persist.rehydrate()`** (bug introduit puis corrigé
  pendant le passage aux vraies URL) : avec `skipHydration`, le middleware `persist` écrit
  l'état courant dans localStorage à **chaque** `set()`, même avant la réhydratation. Un
  `syncRoute()` lancé trop tôt écrasait la sauvegarde avec l'état par défaut : ouvrir un lien
  `/chapitre/…` **effaçait toute la progression locale**. D'où la route initiale appliquée dans
  le `.finally()` du rehydrate dans `AppShell`, juste avant `setHydrated()`. Vaut pour tout
  nouvel effet qui modifierait le store au montage.
- **`motion.path` sans `d` initial** : dans `Mascot.tsx`, animer l'attribut `d` d'un `<path>`
  SVG via `animate={{ d: ... }}` sans jamais fournir de valeur initiale produisait une erreur
  console (`d="undefined"`, SVG invalide) au premier rendu. Fix : fournir `d` en statique *et*
  en `initial={false}` en plus de `animate`.
- **Tailwind v4, incréments d'espacement non standards** : des classes comme `px-4.5`,
  `mt-5.5` (en dehors des paliers `.5` valides : seuls 0.5/1.5/2.5/3.5 existent par défaut) ne
  lèvent aucune erreur — elles ne font juste rien visuellement. Si un espacement semble ignoré
  quelque part, vérifie que la classe utilisée existe bien dans l'échelle Tailwind.
- **`next dev` régénère `AGENTS.md`/`CLAUDE.md`** avec un bloc de règles générique s'il ne les
  trouve pas déjà avec ce bloc présent. `AGENTS.md` (dans ce dossier) contient déjà ce bloc
  pour cette raison précise — **ne le supprime pas**, sinon `next dev` écrasera ce fichier
  `CLAUDE.md` avec son propre contenu générique (`@AGENTS.md`) à la prochaine exécution, et tu
  perdras ces notes.

## Backend MongoDB + Auth.js — état actuel

Optionnel, désactivé par défaut (pas de `.env.local` dans le dossier). Il s'active seulement si
`MONGODB_URI`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` sont **toutes**
présentes. `next.config.ts` en déduit `CAMI_CLOUD_ENABLED`, inliné **au build**, et lu par
`lib/cloud/config.ts` côté client comme côté serveur. Conséquence : changer ces variables en
prod demande un rebuild. Désactivé, la carte « Compte » est absente, `/api/auth/*` répond 404,
`/api/me` répond 401 et `/admin` affiche un message. Procédure d'activation : voir le README.

**Données** (base `MONGODB_DB`, `cami` par défaut) :
- `users` / `accounts` : écrits par `@auth/mongodb-adapter`. On y ajoute seulement `role`
  (absent = élève, `"admin"` = accès `/admin`, à poser à la main dans Atlas).
- `progress` et `preferences` : un document par utilisateur, avec `_id` = `users._id`. Les
  champs de chacun sont listés dans `PROGRESS_KEYS` / `PREFERENCE_KEYS` (`lib/cloud/shape.ts`).
  `sidebarCollapsed` reste volontairement local à l'appareil.
- Il n'y a pas d'index à créer : toutes les lectures se font par `_id`.

**Sécurité** : `/api/me` prend l'id utilisateur uniquement dans la session (jamais dans la
requête). Il valide chaque champ reçu via le schéma de `shape.ts` (clé inconnue, mauvais type,
clé Mongo dangereuse (`.`, `$`) → 400) et limite le corps à 1 Mo. Si tu ajoutes un champ à
`AppState` qui doit suivre le compte, ajoute-le **à la fois** dans `*_KEYS` **et** dans le
schéma correspondant (TS t'y oblige via `Record<keyof …, Check>`).

**Synchro** (`CloudSync.tsx`) : pull une fois par connexion (le serveur gagne pour chaque
document qui existe ; un document absent est créé à partir de l'état local). Ensuite, push
débouncé à 1 s, et seulement du ou des documents dont le JSON a changé. Aucun push n'a lieu
avant la fin du pull (`readyForUser`), pour ne pas écraser le compte avec l'état local. Il n'y
a pas de fusion bidirectionnelle : si deux appareils modifient hors-ligne en parallèle, le
dernier push gagne.

**Tableau de bord admin** (enrichi le 2026-10-15) : toute nouvelle page sous `/admin` doit
appeler `checkAdminAccess()` (`admin/access.ts`) en premier. La page de détail n'affiche les
données d'un élève qu'à un admin, et le test vérifie qu'un élève ne voit pas celles d'un autre.
Définitions (`lib/adminStats.ts`) :
- « commencé » = du code enregistré **différent de l'énoncé** (le code n'est sauvegardé qu'à
  l'édition ; un code remis à l'énoncé par « Réinitialiser » ne compte pas) ;
- « bloqué » = commencé mais pas réussi ;
- « essais ratés » = `passAttempts`, soit les « Vérifier » ratés **dans la session où
  l'exercice a été réussi** (le compteur de `useAppStore` n'est pas persisté). C'est donc un
  minimum, pas un total sur toute la vie de l'exercice.

Le code des élèves est affiché via `highlightCode`, qui échappe `& < >` : c'est ce qui rend le
`dangerouslySetInnerHTML` sûr, vérifié par un test avec du `<b>` dans le code. Le tableau
charge tous les documents `progress` (avec `code`) : c'est suffisant pour une ou quelques
classes, il faudra paginer ou agréger côté MongoDB au-delà de quelques centaines d'élèves.
Testé contre Docker `mongo:7` : calculs (12 vérifications sur des données construites) et
navigateur (19 vérifications : refus pour un élève sur les deux pages, classement, détail,
code coloré et échappé, 404 sur un id invalide ou inexistant).

**Testé** (le 2026-10-11, contre Docker `mongo:7` avec un cookie de session JWE forgé via
`encode` de `next-auth/jwt`, salt = nom du cookie `authjs.session-token`). Scripts jetables,
hors du repo :
- API (26 vérifications) : sans session → 401 ; GET d'un compte vide ; PUT puis GET en
  aller-retour ; PUT partiel ; rejet des champs invalides (clés `$` et `.`, types, corps
  > 1 Mo → 413) ; `/admin` (refus pour un élève, tableau pour un admin) ; signin Google qui
  redirige vers `accounts.google.com` avec le bon `redirect_uri`.
- Navigateur, Playwright (14 vérifications) : bouton Google une fois déconnecté ; pull (la
  progression et les préférences du serveur arrivent en local, thème appliqué, modale
  Bienvenue masquée) ; push d'un changement de thème vers Mongo sans écraser la progression ;
  lien admin ; compte neuf initialisé depuis l'état local ; aucune erreur JS.
- Build : sans variables (mode local) et avec un `.env.local` (le flag passe bien à `true`).

## Simplifications assumées (dette technique connue, disclosed à l'utilisateur)

Trois fonctionnalités de l'ancienne version n'avaient **pas** été portées, pour garder le
périmètre de la réécriture gérable. L'auto-complétion (point 2) a depuis été refaite
(2026-10-15, voir « Éditeur de code » plus bas) — les deux autres manquent toujours :

1. **Mode "pas à pas"** — un débogueur ligne par ligne qui existait dans l'ancienne version de
   l'interpréteur/UI. `algoEngineCore.js` a probablement encore les hooks nécessaires côté
   moteur (à vérifier) mais l'UI pour piloter ça (pas → pas → pas, surbrillance de ligne
   courante) n'existe pas dans ce projet.
2. **Auto-complétion** dans `CodeEditor.tsx` — l'éditeur actuel est un textarea + overlay de
   coloration syntaxique, sans suggestion de complétion.
3. **"Mode révision"** — présent dans l'ancienne version, absent ici (aucune trace dans le
   routeur `route` du store ni dans `Sidebar.tsx`).

Si l'utilisateur demande l'une de ces trois choses, ce sont des ajouts nets, pas des bugs à
corriger.

## Déploiement Docker (ajouté le 2026-10-17)

- `Dockerfile` en plusieurs étapes, `node:24-alpine`, `output: "standalone"` (next.config.ts),
  utilisateur non-root, `HEALTHCHECK` sur `/api/health` (qui ne touche pas MongoDB, exprès).
  `AUTH_TRUST_HOST=true` est défini dans l'image.
- **Aucun secret dans l'image** : `.dockerignore` exclut tous les `.env*`, car Next lit ces
  fichiers pendant le build et ils finiraient dans les couches. Le flag cloud étant décidé au
  build, `next.config.ts` accepte `CAMI_CLOUD_ENABLED=true` explicite (argument de build Docker,
  `true` par défaut), sans avoir besoin des secrets à ce moment-là.
- **Piège corrigé : `redirect_uri` en `https://0.0.0.0:3000`.** Derrière le proxy HTTPS d'un
  hébergeur (Render), le serveur `standalone` reconstruit l'URL de la requête à partir de son
  adresse d'écoute (`HOSTNAME=0.0.0.0`). Auth.js en déduisait l'URL de callback, et Google
  bloquait la connexion (« Erreur 400 : invalid_request », message « doesn't comply with
  Google's OAuth 2.0 policy »). `app/api/auth/[...nextauth]/route.ts` reconstruit maintenant
  l'URL publique à partir de `X-Forwarded-Host`/`Host` et `X-Forwarded-Proto` ; un `AUTH_URL`
  explicite garde la priorité. Vérifié avec `node .next/standalone/server.js` et de vrais
  en-têtes `Host` (attention : `fetch` de Node **supprime** l'en-tête `Host`, il faut
  `node:http` pour tester ça).
- `docker-compose.yml` : essai local sur le port 3100 (3000 et 8080 sont pris par un autre
  projet Docker de l'utilisateur, `fixeo`). Variables dans `.env.docker` (non versionné) ; le
  nom n'est volontairement pas `.env.production`, que Next chargerait automatiquement au build.
- Hébergeur recommandé à l'utilisateur : **Google Cloud Run `africa-south1` (Johannesburg)**,
  parce que le cluster Atlas est chez AWS **`af-south-1` (Le Cap)** (lu via la commande
  `hello`). Guide pas à pas dans `DEPLOY.md` : Secret Manager, Cloud Build, `gcloud run
  deploy`, callback OAuth, publication de l'écran de consentement, Atlas `0.0.0.0/0`.

## PWA (ajoutée le 2026-10-15)

- `app/manifest.ts` : manifeste. Icônes dans `public/icons/` (any 192/512 + maskable 512),
  `app/icon.png` (onglet) et `app/apple-icon.png` (iOS), générées depuis un SVG du logo `</>`
  (script jetable Playwright, hors du repo ; regénère-les plutôt que de les retoucher à la
  main). L'ancien `favicon.ico` (triangle Vercel par défaut) a été supprimé.
- `app/sw.js/route.ts` : le service worker est **une route statique**, pas un fichier de
  `public/`, pour tirer la liste des pages hors-ligne de `lib/routes.ts`. Version = date du
  build (nouveau worker et caches neufs à chaque déploiement). Stratégie : pages de l'app →
  réseau d'abord puis cache ; `/_next/static` et `/icons` → cache d'abord ; `/api`, `/admin`
  et la connexion Google → **jamais interceptés**. Si tu ajoutes une page hors de `routes.ts`,
  elle ne sera simplement pas disponible hors-ligne.
- `lib/pwa.ts` : enregistrement du worker (**production uniquement**), état d'installation
  (`useInstallState`), `promptInstall`. L'événement `beforeinstallprompt` est capturé par un
  script inline dans `app/layout.tsx`, parce qu'il peut arriver avant le chargement (différé)
  de l'app.
- UI : `InstallCard` (Réglages → Application, avec les instructions iOS et le cas générique)
  et `InstallBanner` (téléphone seulement, refermable pour de bon via localStorage).
- Testé en production (`next start`) avec Playwright : manifeste et icônes, `sw.js`
  (en-têtes, 36 pages, version stable), Chrome « installable » (aucune erreur
  d'installabilité), **hors-ligne** (lien direct vers un chapitre jamais visité, exécution du
  moteur, bac à sable, rechargement ; `/admin` non servi), bandeau et dialogue d'installation,
  parcours iPhone. Piège de test : un profil Chrome dans un dossier au chemin trop long fait
  échouer Cache Storage (« Unexpected internal error », limite de 260 caractères de Windows),
  ce qui ne concerne pas les vrais utilisateurs.
- **Turbopack (dev)** : après des suppressions ou déplacements de fichiers de route
  (`app/page.tsx`…), `next dev` peut paniquer en boucle (« Failed to write app endpoint
  /page ») et recharger la page sans fin. Remède : arrêter `next dev`, supprimer `.next/dev`,
  relancer.

## Mise en page mobile

`AppShell` est en `flex-col md:flex-row`. Il était en `flex` simple depuis la réécriture : sur
téléphone, la barre du haut (☰ CaMI) devenait une colonne pleine hauteur qui mangeait environ
30 % de l'écran. Corrigé et vérifié en émulation Pixel 7 en même temps que la PWA (pas de
défilement horizontal, menu, bandeau ; ordinateur inchangé).

## Éditeur de code — suggestions et erreurs en direct

Ajoutés le 2026-10-15 à la demande de l'utilisateur ; l'ancienne version (fichier HTML) n'était
plus disponible, donc **conçus de zéro**, pas portés.

- **Suggestions** (`lib/completions.ts`, fonctions pures) : mots-clés, blocs (snippets avec
  indentation + position du curseur `$0`), fonctions intégrées, méthodes après un `.`, et noms
  déjà présents dans le code de l'élève. Le vocabulaire ne contient **que ce que
  `algoEngineCore.js` sait exécuter** (builtins de `callFunc`, méthodes de `callMethod`, pas de
  `pass`/`import`) : si tu ajoutes un builtin au moteur, ajoute-le aussi là. Les blocs pseudo
  suivent les graphies du cours (`FINSI`, `FINPOUR`, `FINTANTQUE`, `FINFONCTION` en un mot ;
  `TANT QUE`, `SINON SI` en deux). Clavier : ↑/↓, Entrée ou Tab pour valider, Échap,
  Ctrl+Espace pour ouvrir à la demande. Un mot déjà complet qui n'est pas un bloc (`SINON`,
  `return`, une variable) ferme la liste, sinon l'Entrée de fin de ligne insérerait une
  suggestion plus longue.
- **Erreurs en direct** (`lib/diagnostics.ts`) : pas d'analyseur statique. Le code passe par le
  **vrai interpréteur** (pur, synchrone, sans E/S), 450 ms après la dernière frappe, avec
  `maxSteps` réduit à 20 000. Le dépassement de ce budget et les erreurs JS internes du moteur
  ne sont pas affichés. Rien ne s'affiche tant que l'élève n'a pas tapé : **41 des 77 énoncés
  de départ ne s'exécutent pas tels quels** (trous à compléter) et s'afficheraient en rouge
  dès l'ouverture.
- Le moteur (`algoEngineCore.js`) n'a **pas** été modifié pour ça.
- **Barre de symboles** (en bas de l'éditeur, sous le code et au-dessus du message d'erreur, qui apparaît et disparaît et la ferait sauter sinon ; symboles différents en pseudo et en Python) :
  l'insertion passe par `document.execCommand("insertText")`, volontairement malgré son statut
  de méthode dépréciée. C'est le seul moyen d'écrire dans un textarea en gardant l'historique
  d'annulation natif (Ctrl+Z) et l'événement `input` (donc suggestions et erreurs réagissent).
  Il y a un repli manuel s'il échoue. `onMouseDown` + `preventDefault` sur la barre garde le
  focus, donc le clavier du téléphone reste ouvert.
- La liste de suggestions **suit** le curseur au défilement et au redimensionnement, au lieu de
  se fermer : sur téléphone, la page défile toute seule pendant la frappe. Elle ne se ferme que
  si la ligne sort de l'écran.
- Ligatures de police désactivées dans l'éditeur : JetBrains Mono affichait `!=` comme « ≠ ».
- Vérifié : les 77 solutions et les 32 alternatives du cours ne déclenchent aucune fausse
  erreur (analyse la plus lente : 15 ms). Tests navigateur Playwright : liste, navigation au
  clavier, snippets, méthodes, soulignement, numéro de ligne, clic sur le message, disparition
  après correction, pseudo et Python. Scripts jetables, hors du repo.

## Commandes utiles

```bash
npm install
npm run dev              # http://localhost:3000
npm run build             # build de prod (rapide, hors-ligne)
npx tsc --noEmit           # vérif de types seule, plus rapide qu'un build complet
npx eslint .                # lint (aussi exécuté par `next build`)
```

Pas de suite de tests automatisés committée dans ce zip (les vérifications faites pendant
l'écriture de ce projet étaient des scripts Playwright jetables, hors du repo). Si tu ajoutes
des tests, Playwright + un serveur `next dev` local est l'approche qui a été utilisée ici pour
valider le comportement réel (navigation, exécution du moteur, animations, responsive).
