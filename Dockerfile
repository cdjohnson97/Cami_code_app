# syntax=docker/dockerfile:1
#
# CaMI — image de production (Next.js "standalone").
# Aucun secret dans l'image : MONGODB_URI, AUTH_SECRET, AUTH_GOOGLE_* sont fournis au
# lancement du conteneur (docker compose / hébergeur). Voir DEPLOY.md.

# ---- 1. Dépendances ---------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. Build -----------------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# true = comptes Google + synchro MongoDB actifs (les secrets arrivent au lancement).
# false = app 100 % locale (localStorage), sans carte « Compte » ni /admin.
ARG CAMI_CLOUD_ENABLED=true
ENV CAMI_CLOUD_ENABLED=$CAMI_CLOUD_ENABLED \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 3. Image finale ----------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    # Derrière le proxy HTTPS de l'hébergeur : Auth.js doit faire confiance à l'en-tête Host.
    AUTH_TRUST_HOST=true

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Ne touche pas à MongoDB (voir src/app/api/health/route.ts).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

# PORT est lu par server.js (les hébergeurs comme Cloud Run imposent le leur, ex. 8080).
CMD ["node", "server.js"]
