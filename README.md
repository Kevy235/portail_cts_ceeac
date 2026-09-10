# Portail documentaire — Réunions statutaires de la CEEAC

Portail sécurisé permettant au Secrétariat de la CEEAC de gérer les réunions statutaires, les participants et les documents officiels, et aux experts accrédités d'accéder à la bibliothèque — avant, pendant et après chaque réunion.

## Pile technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 · Vite 6 · Tailwind CSS 4 · React Router 7 |
| Backend | Node.js 22 · Express · JWT (cookie httpOnly) · Multer |
| Base de données | PostgreSQL (migrations SQL automatiques au démarrage) |
| Déploiement | Docker · Dokploy (voir `DEPLOYMENT.md`) |

## Fonctionnalités

- **Multilingue (4 langues CEEAC)** : interface intégralement traduite en français, anglais, portugais et espagnol ; sélecteur de langue sur la page de connexion et dans l'en-tête ; contenus du portail éditables par langue par l'administrateur.
- **Authentification** : connexion e-mail/mot de passe, rôles admin/participant, mot de passe provisoire à la création d'un compte avec changement obligatoire à la première connexion ; révocation immédiate des sessions (compte désactivé, mot de passe réinitialisé).
- **Auto-inscription par réunion** : chaque réunion statutaire reçoit à sa création un **identifiant** (`CEEAC-XXXXXX`) et un **mot de passe d'accès** générés automatiquement. L'administrateur les transmet aux États membres (bouton « Copier l'invitation ») ; chaque expert crée ensuite lui-même son compte sur la page `/inscription` avec ses propres informations, puis accède aux documents. Les accès sont régénérables à tout moment. L'inscription se ferme à la clôture de la réunion ; la consultation des documents reste possible.
- **Espace administrateur** : tableau de bord (statistiques réelles, journal d'activité), gestion des participants, gestion documentaire multilingue (un document = jusqu'à 4 versions linguistiques, publication/brouillon, catégories, marquage **document codé**, **nouvelle version** remplaçable dans toutes les langues même si le document est déjà publié), réunions statutaires (création, organe CEEAC, édition, statuts, ajout/modification de documents pour une réunion planifiée, en cours ou terminée, accès d'inscription, fil de discussion), édition des contenus du portail dans les 4 langues.
- **Diffusion des rapports par e-mail** : envoi en un clic d'un rapport de réunion à tous les participants actifs (ou aux seuls inscrits d'une session), avec liens de téléchargement par langue — nécessite la configuration SMTP (voir `.env.example`).
- **Espace participant** : bibliothèque documentaire (recherche, filtres par catégorie et par réunion, regroupement avant / pendant / après, badge « codé », numéro de version, téléchargement par langue), réunions & fils de discussion, profil avec préférences de langue et changement de mot de passe.
- **Discussions par réunion** : fil d'échanges lié à chaque réunion statutaire, ouvert aux participants et aux administrateurs (rafraîchissement automatique avec prise en compte des suppressions, suspension en arrière-plan, suppression par l'auteur ou l'admin).
- **Guide utilisateur téléchargeable** : l'administrateur publie le guide officiel dans chacune des 4 langues (Paramètres → Guide utilisateur) ; il est proposé au téléchargement sur la page du guide (accessible sans connexion depuis la page d'accueil) et dans l'espace participant.
- **Accessibilité** : taille de texte réglable (A / A+ / A++, mémorisée), anneaux de focus visibles au clavier, dialogues modaux accessibles (focus piégé, Échap, `aria-modal`), libellés traduits pour les lecteurs d'écran.

## Développement local

Prérequis : Node.js ≥ 20. Aucune installation de PostgreSQL n'est nécessaire : un serveur embarqué est fourni pour le développement.

```bash
npm install
npm i --no-save embedded-postgres   # PostgreSQL local embarqué (une seule fois)
npm run dev:db                      # terminal 1 : base de données locale
npm run dev                         # terminal 2 : API :3001 + frontend :5173 (proxy /api)
```

Si vous disposez déjà d'un PostgreSQL, ignorez `dev:db` et définissez `DATABASE_URL` (copiez `.env.example` vers `.env`).

Le compte administrateur initial est créé au premier démarrage à partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD` (valeurs par défaut en développement : `admin@ceeac-eccas.org` / `ChangezMoi!2025`).

### Scripts

| Commande | Description |
|---|---|
| `npm run dev` | API + frontend en mode développement (rechargement à chaud) |
| `npm run build` | Build de production (frontend `dist/`, backend `server/dist/`) |
| `npm start` | Démarre le serveur de production (sert aussi le frontend) |
| `npm run typecheck` | Vérification TypeScript des deux projets |
| `npm run test:smoke` | Test de bout en bout (API réelle + PostgreSQL) |
| `npm run dev:db` | PostgreSQL local embarqué pour le développement |

## Structure du projet

```
├── server/src/          API Express + PostgreSQL
│   ├── index.ts         point d'entrée (middlewares, routage, statique)
│   ├── migrations.ts    schéma SQL versionné
│   ├── auth.ts          JWT, cookies, gardes admin
│   └── routes/          auth, participants, documents, sessions, stats, paramètres
├── src/                 Frontend React
│   ├── pages/           connexion, admin/*, participant/*
│   ├── components/      layout, discussion, composants UI partagés
│   ├── context/         AuthContext, SettingsContext
│   ├── i18n/            dictionnaires fr/en/pt/es + contexte de langue
│   └── lib/             client API, types, formatage
├── Dockerfile           image de production (multi-étapes)
└── DEPLOYMENT.md        guide de déploiement Dokploy (VPS Hostinger)
```

## Charte graphique

Les couleurs sont dérivées du logo CEEAC-ECCAS (`logo_ceeac.png`) : bleu du globe `#006EB5` (couleur primaire), vert du continent `#3DA281` (accent), rouge du lettrage `#C1272D` (alertes). Typographies : Source Serif 4 (titres) et Inter (texte).
