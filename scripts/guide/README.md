# Génération du guide utilisateur (Word, 4 langues)

Produit le guide utilisateur PDRS-CEEAC (version 3.0) en français, anglais,
portugais et espagnol, avec des captures d'écran réelles de la plateforme
prises dans chaque langue d'interface :

```
docs/Guide-Utilisateur-PDRS-CEEAC-FR.docx
docs/Guide-Utilisateur-PDRS-CEEAC-EN.docx
docs/Guide-Utilisateur-PDRS-CEEAC-PT.docx
docs/Guide-Utilisateur-PDRS-CEEAC-ES.docx
```

Ces fichiers se publient ensuite par l'administrateur dans **Contenus du portail ›
Guide utilisateur (document)** : ils sont alors proposés en lecture (lecteur
intégré) et en téléchargement sur la page du guide.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `screenshots.mjs` | Crée des données de démonstration (réunion, documents PDF et Word réels, comptes), capture le parcours complet dans chaque langue (`captures/<langue>/`), puis supprime toutes les données de démonstration. |
| `content/<langue>.mjs` | Texte du guide dans chaque langue (`fr.mjs` fait référence). Les libellés cités reprennent ceux de `src/i18n/<langue>.ts`. |
| `build-guide.mjs` | Mise en page Word commune (page de garde, fiche du document, sommaire, figures et tableaux numérotés, encadrés). |
| `viewer-check.mjs` | Vérification rapide du lecteur intégré sur les documents existants (erreurs de console). |

## Prérequis

- L'application lancée en local sur `http://localhost:3001` (build de production :
  `npm run build && npm start`, base de dev : `node scripts/dev-db.mjs`), avec le
  compte admin par défaut du développement (`ADMIN_EMAIL` / `ADMIN_PASSWORD`
  surchargeables par variables d'environnement).
- Dépendances de ce dossier :

```bash
cd scripts/guide
npm install
npx playwright install chromium   # facultatif sous Windows : Edge est utilisé en repli
```

## Utilisation

```bash
node screenshots.mjs            # 4 langues (ou : node screenshots.mjs fr en)
node build-guide.mjs            # 4 guides dans docs/ (ou : node build-guide.mjs fr)
```

Recopiez ensuite `captures/<langue>/` dans `docs/captures/<langue>/` : c'est la copie
versionnée (le dossier `captures/` de travail est ignoré par git).
**Ne jamais lancer `screenshots.mjs` contre la production** : il crée puis supprime
des données de démonstration.

À l'ouverture d'un guide, Word propose de « mettre à jour les champs » —
acceptez pour générer la table des matières et le nombre total de pages.

Les guides livrés dans `docs/` ont été ouverts une fois dans Word pour calculer le
sommaire, puis exportés en PDF (`Fichier › Exporter › PDF`) : publiez de préférence
la version **PDF** sur la plateforme, elle s'affiche à l'identique dans le lecteur
intégré ; la version Word reste disponible pour modification.
