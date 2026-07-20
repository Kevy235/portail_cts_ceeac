# Plateforme d'accès aux documents — CTS-DSS · CEEAC

Portail sécurisé permettant au Secrétariat du CTS-DSS-CEEAC de gérer les participants, les sessions et les documents officiels du Comité Technique Spécialisé Défense, Sûreté et Sécurité, et aux experts accrédités d'accéder à la bibliothèque documentaire.

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
- **Auto-inscription par session** : chaque session CTS reçoit à sa création un **identifiant** (`CTS-XXXXXX`) et un **mot de passe d'accès** générés automatiquement. L'administrateur les transmet aux États membres (bouton « Copier l'invitation ») ; chaque expert crée ensuite lui-même son compte sur la page `/inscription` avec ses propres informations, puis accède aux documents. Les accès sont régénérables à tout moment.
- **Espace administrateur** : tableau de bord (statistiques réelles, journal d'activité), gestion des participants (création manuelle, suivi des auto-inscrits par session, réinitialisation de mot de passe avec confirmation, suppression), gestion documentaire multilingue (un document = jusqu'à 4 versions linguistiques PDF/Office, publication/brouillon, catégories, marquage **document codé** pour les fichiers chiffrés avant téléversement), sessions CTS (création, édition, statuts, accès d'inscription, fil de discussion), édition des contenus du portail dans les 4 langues.
- **Diffusion des rapports par e-mail** : envoi en un clic d'un rapport de réunion à tous les participants actifs (ou aux seuls inscrits d'une session), avec liens de téléchargement par langue — nécessite la configuration SMTP (voir `.env.example`).
- **Espace participant** : bibliothèque documentaire (recherche, filtres par catégorie, badge « codé », téléchargement par langue, filtrage selon les langues choisies), sessions & fils de discussion, profil avec préférences de langue (interface + documents) et changement de mot de passe.
- **Discussions par session** : fil d'échanges lié à chaque session CTS, ouvert aux participants et aux administrateurs (rafraîchissement automatique avec prise en compte des suppressions, suspension en arrière-plan, suppression par l'auteur ou l'admin).
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
