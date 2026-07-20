# Génération du guide participant (Word)

Régénère `docs/Guide-Participant-Plateforme-CTS-DSS.docx` (version 2.0) avec
des captures d'écran réelles de l'application : connexion (deux onglets),
accès invité par codes de session, inscription, bibliothèque (consultation +
téléchargement), discussions, profil.

## Prérequis

- L'application lancée en local sur `http://localhost:3001` (build de production :
  `npm run build && npm start`), avec le compte admin par défaut du développement.
- Dépendances (déclarées dans le package.json de ce dossier) :

```bash
cd scripts/guide
npm install
npx playwright install chromium
```

## Utilisation

```bash
node screenshots.mjs   # crée les données de démo, capture, puis nettoie tout
node build-guide.mjs   # assemble le .docx dans docs/
```

`screenshots.mjs` écrit les captures dans `./captures` ; `build-guide.mjs` lit
ce même dossier (adaptez les chemins `PROJECT`/`CAPTURES` en tête de fichier si
vous les déplacez). Pensez à recopier les captures dans `docs/captures/` pour
le dépôt. Les données de démonstration (session, documents, comptes
`*demo@exemple.org`) sont supprimées automatiquement à la fin, même en cas
d'échec — le script purge aussi les résidus d'exécutions précédentes au départ.

Note : à l'ouverture du document, Word propose de « mettre à jour les champs » —
acceptez pour générer la table des matières.
