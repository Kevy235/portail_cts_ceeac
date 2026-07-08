# ─── Étape 1 : build du frontend et du backend ─────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Étape 2 : image de production allégée ──────────────────────────────────────
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist

# Répertoire des fichiers téléversés (monté en volume par Dokploy),
# détenu par l'utilisateur non privilégié `node`.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
VOLUME /app/uploads

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server/dist/index.js"]
