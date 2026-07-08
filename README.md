# Plateforme d'accès aux documents — CTS-APPS · CEEAC

Portail sécurisé permettant au Secrétariat du DAPPS-CEEAC de gérer les participants, les sessions et les documents officiels du Comité Technique Spécialisé des Affaires Politiques, Paix et Sécurité, et aux experts accrédités d'accéder à la bibliothèque documentaire.

## Pile technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 · Vite 6 · Tailwind CSS 4 · React Router 7 |
| Backend | Node.js 22 · Express · JWT (cookie httpOnly) · Multer |
| Base de données | PostgreSQL (migrations SQL automatiques au démarrage) |
| Déploiement | Docker · Dokploy (voir `DEPLOYMENT.md`) |

## Fonctionnalités

- **Authentification** : connexion e-mail/mot de passe, rôles admin/participant, mot de passe provisoire à la création d'un compte avec changement obligatoire à la première connexion.
- **Espace administrateur** : tableau de bord (statistiques réelles, journal d'activité), gestion des participants (création, édition, réinitialisation de mot de passe, suppression), gestion documentaire (téléversement PDF/Office, publication/brouillon, catégories), sessions CTS (création, édition, statuts), édition de tous les contenus du portail (textes de la page de connexion, en-tête, pied de page, catégories).
- **Espace participant** : bibliothèque documentaire (recherche, filtres par catégorie, téléchargement comptabilisé), profil et changement de mot de passe.

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
│   ├── components/      layout, composants UI partagés
│   ├── context/         AuthContext, SettingsContext
│   └── lib/             client API, types, formatage
├── Dockerfile           image de production (multi-étapes)
└── DEPLOYMENT.md        guide de déploiement Dokploy (VPS Hostinger)
```

## Charte graphique

Les couleurs sont dérivées du logo CEEAC-ECCAS (`logo_ceeac.png`) : bleu du globe `#006EB5` (couleur primaire), vert du continent `#3DA281` (accent), rouge du lettrage `#C1272D` (alertes). Typographies : Source Serif 4 (titres) et Inter (texte).
