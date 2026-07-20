# Guide de déploiement — VPS Hostinger avec Dokploy

Ce guide décrit le déploiement de la **Plateforme d'accès aux documents CTS-DSS** sur un VPS Hostinger où **Dokploy est déjà installé** et héberge d'autres projets.

## Architecture déployée

```
Internet ──► Traefik (géré par Dokploy, HTTPS automatique)
                │
                ▼
        Application Node.js (conteneur Docker, port 3001)
        ├── sert le frontend React compilé (fichiers statiques)
        ├── expose l'API REST sous /api
        └── volume persistant /app/uploads (fichiers des documents)
                │
                ▼
        PostgreSQL 16 (service Dokploy, réseau interne)
```

Un seul conteneur applicatif : le serveur Express sert à la fois l'API et le frontend compilé. Les migrations de base de données s'exécutent automatiquement au démarrage.

Sécurité intégrée à l'application (aucune configuration requise) : cookies httpOnly/Secure, limitation des tentatives de connexion (20 / 15 min par IP), en-têtes de sécurité (HSTS, nosniff, X-Frame-Options), conteneur exécuté en utilisateur non-root, arrêt propre lors des redéploiements.

> **Deux modes de déploiement possibles dans Dokploy** :
> - **Mode recommandé (ce guide)** : un service *Application* (Dockerfile) + un service *Database* PostgreSQL gérés par Dokploy — vous profitez des sauvegardes intégrées de Dokploy.
> - **Mode Compose** : un service *Compose* pointant sur le `docker-compose.yml` du dépôt (application + PostgreSQL ensemble). Utile aussi pour tester en local : `docker compose up --build` avec `POSTGRES_PASSWORD`, `JWT_SECRET` et `ADMIN_PASSWORD` définis.

---

## Étape 1 — Pousser le code sur un dépôt Git

Dokploy se connecte à GitHub, GitLab, Bitbucket ou Gitea. Si ce n'est pas déjà fait :

```bash
git init
git add .
git commit -m "Plateforme CTS-DSS : version dynamique (PostgreSQL + Express)"
git remote add origin https://github.com/VOTRE_COMPTE/portail-cts.git
git push -u origin main
```

> Le fichier `.gitignore` exclut déjà `node_modules`, `dist`, `uploads` et `.env`.

## Étape 2 — Créer la base de données PostgreSQL dans Dokploy

1. Dans le tableau de bord Dokploy, ouvrez votre **Projet** (ou créez-en un, ex. `portail-cts`).
2. Cliquez sur **Create Service → Database → PostgreSQL**.
3. Renseignez :
   - **Name** : `portail-cts-db`
   - **Database Name** : `portail_cts`
   - **User** : `portail_cts`
   - **Password** : générez un mot de passe fort (bouton dés ou `openssl rand -base64 24`)
4. Cliquez sur **Create** puis **Deploy**.
5. Ouvrez l'onglet **Connections** (ou *Internal Credentials*) du service et **copiez l'URL de connexion interne** affichée par Dokploy. **Attention** : le nom d'hôte interne réel n'est **pas** le nom que vous avez saisi — Dokploy génère un identifiant technique (ex. `portail-cts-portailctsdb-x3k9f2`). Utilisez toujours l'URL copiée depuis cet onglet :

```
postgresql://portail_cts:MOT_DE_PASSE@NOM_INTERNE_GENERE:5432/portail_cts
```

6. **N'exposez pas le port 5432 sur Internet** (laissez "External Port" vide).

## Étape 3 — Créer l'application

1. Dans le même projet : **Create Service → Application**.
2. **Source** : sélectionnez votre fournisseur Git, le dépôt et la branche `main`.
3. Onglet **Build** : choisissez **Dockerfile** (le fichier `Dockerfile` est à la racine du dépôt).

## Étape 4 — Variables d'environnement

Onglet **Environment** de l'application, ajoutez :

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://portail_cts:MOT_DE_PASSE@NOM_INTERNE_GENERE:5432/portail_cts
JWT_SECRET=CHAINE_ALEATOIRE_LONGUE
ADMIN_EMAIL=admin@ceeac-eccas.org
ADMIN_PASSWORD=MOT_DE_PASSE_ADMIN_FORT
ADMIN_NAME=Secrétariat CTS-DSS
APP_URL=https://documents.votre-domaine.org
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_MB=50

# Diffusion des rapports par e-mail (optionnel — la fonction est
# désactivée proprement si SMTP_HOST est absent)
SMTP_HOST=smtp.votre-fournisseur.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@votre-domaine.org
SMTP_PASS=MOT_DE_PASSE_SMTP
SMTP_FROM="Plateforme CTS-DSS <no-reply@votre-domaine.org>"
```

- `JWT_SECRET` : générez-le avec `openssl rand -base64 48` (**obligatoire en production**, le démarrage échoue sinon).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` : identifiants du compte administrateur créé **au premier démarrage uniquement** (s'il n'existe aucun admin). `ADMIN_PASSWORD` est **obligatoire en production**. Changez ensuite le mot de passe depuis l'application si besoin.
- `APP_URL` : URL publique de la plateforme, utilisée pour construire les liens dans les e-mails de diffusion.
- `SMTP_*` : paramètres du serveur d'envoi pour la fonction « Diffuser par e-mail » (rapports de réunion envoyés aux participants). `SMTP_SECURE=true` pour le port 465 (TLS implicite), `false` pour le port 587 (STARTTLS).

## Étape 5 — Volume persistant pour les fichiers

Les documents téléversés doivent survivre aux redéploiements :

1. Onglet **Advanced → Volumes / Mounts** de l'application.
2. Ajoutez un **Volume Mount** :
   - **Volume Name** : `portail-cts-uploads`
   - **Mount Path** : `/app/uploads`

## Étape 6 — Nom de domaine et HTTPS

1. Chez votre registrar (ou Hostinger DNS), créez un enregistrement **A** pointant vers l'IP du VPS, ex. `documents.votre-domaine.org`.
2. Dans Dokploy, onglet **Domains** de l'application : **Add Domain** :
   - **Host** : `documents.votre-domaine.org`
   - **Container Port** : `3001`
   - **HTTPS** : activé, **Certificate** : Let's Encrypt
3. Sauvegardez. Traefik obtient le certificat automatiquement.

## Étape 7 — Premier déploiement

1. Cliquez sur **Deploy**. Suivez l'onglet **Logs** ; vous devez voir :

```
[db] migration 1 appliquée : schema initial
[db] migration 2 appliquée : données de référence
[seed] compte administrateur créé : admin@ceeac-eccas.org
[api] serveur démarré sur le port 3001 (production)
```

2. Vérifiez la santé de l'application : `https://documents.votre-domaine.org/api/health` doit répondre `{"status":"ok"}`.
3. Connectez-vous avec le compte admin, puis :
   - complétez les **Contenus du portail** (onglet Paramètres),
   - créez les sessions CTS et les comptes participants.

## Étape 8 — Déploiements automatiques (optionnel)

Onglet **Deployments → Auto Deploy** : activez le déploiement automatique (webhook Git). Chaque `git push` sur `main` reconstruira et redéploiera l'application sans interruption notable.

## Étape 9 — Sauvegardes (fortement recommandé)

### Base de données

Dokploy intègre la sauvegarde planifiée des bases PostgreSQL :

1. Service `portail-cts-db` → onglet **Backups** → **Create Backup**.
2. Configurez une **destination S3** (Dokploy → Settings → S3 Destinations ; compatible avec tout stockage S3 : AWS, Backblaze, IDrive, etc.).
3. Planification recommandée : quotidienne (`0 3 * * *`), rétention selon votre politique.

### Fichiers téléversés

Le volume `portail-cts-uploads` vit sur le VPS (`/var/lib/docker/volumes/portail-cts-uploads/_data`). Ajoutez-le à votre routine de sauvegarde du serveur (rsync/restic vers un stockage externe), par exemple :

```bash
restic backup /var/lib/docker/volumes/portail-cts-uploads/_data
```

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Variables d'environnement manquantes en production` dans les logs | `DATABASE_URL` ou `JWT_SECRET` absent | Complétez l'onglet Environment et redéployez |
| `getaddrinfo ENOTFOUND …` au démarrage | Le nom d'hôte dans `DATABASE_URL` n'existe pas sur le réseau Docker | Copiez l'URL interne exacte depuis l'onglet *Connections* de la base (le nom généré par Dokploy diffère du nom saisi) ; l'app et la base doivent être dans le même projet |
| `ECONNREFUSED` vers PostgreSQL | Base arrêtée ou mauvais hôte dans `DATABASE_URL` | Utilisez le nom interne du service (pas `localhost`) et vérifiez que la base est déployée |
| Erreur 502 sur le domaine | Mauvais port dans Domains | Le Container Port doit être `3001` |
| Les fichiers disparaissent après redéploiement | Volume non monté | Vérifiez le montage `/app/uploads` (Étape 5) |
| Upload refusé (« trop volumineux ») | Limite applicative ou Traefik | Augmentez `MAX_UPLOAD_MB` ; Traefik n'impose pas de limite par défaut |

## Mise à jour de l'application

```bash
git add . && git commit -m "…" && git push
```

Puis **Deploy** dans Dokploy (ou automatique si l'Étape 8 est configurée). Les nouvelles migrations SQL éventuelles s'appliquent toutes seules au démarrage.

Le dépôt inclut une CI GitHub Actions (`.github/workflows/ci.yml`) qui, à chaque push : vérifie les types, construit le frontend et le backend, exécute le test de bout en bout contre un vrai PostgreSQL et valide la construction de l'image Docker. Attendez que la CI soit verte avant de déployer.

## Checklist de mise en production

- [ ] `JWT_SECRET` généré aléatoirement (48+ caractères), jamais réutilisé d'un autre projet
- [ ] `ADMIN_PASSWORD` fort et stocké dans un gestionnaire de mots de passe (obligatoire : le démarrage échoue sinon)
- [ ] `APP_URL` renseigné (liens corrects dans les e-mails)
- [ ] Port PostgreSQL **non exposé** sur Internet (pas d'External Port dans Dokploy)
- [ ] Port 3001 de l'application **non publié** directement (uniquement via Traefik) — sinon le rate-limit de connexion peut être contourné
- [ ] Volume `/app/uploads` monté (Étape 5)
- [ ] Domaine en HTTPS avec certificat Let's Encrypt actif
- [ ] `https://…/api/health` répond `{"status":"ok"}`
- [ ] Variables `SMTP_*` configurées si la diffusion des rapports par e-mail est souhaitée (testez avec le bouton « Diffuser » d'une session)
- [ ] Sauvegarde planifiée de la base configurée (Étape 9)
- [ ] Connexion admin testée + contenus du portail personnalisés
- [ ] Parcours d'auto-inscription testé : créer une session, copier l'invitation, créer un compte via `/inscription`, puis supprimer le compte de test
