# Imagem de produção do Arton de Bolso (front-end).
#
# Build em dois estágios: o primeiro instala tudo e roda `next build`; o
# segundo leva só o .next/standalone (server.js + node_modules mínimos), os
# assets estáticos e o public/. Ver `output: "standalone"` no next.config.ts.
#
#   docker build -t arton-de-bolso-frontend .
#   docker run -p 3000:3000 -e FOUNDRY_URL=http://<foundry>:30000 arton-de-bolso-frontend
#
# Uma réplica só: as sessões vivem na memória do processo Node.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
# É o que o `docker compose up --wait` do deploy espera ficar "healthy".
HEALTHCHECK --interval=5s --timeout=3s --start-period=30s --retries=6 \
  CMD wget -qO- http://127.0.0.1:3000 >/dev/null || exit 1
CMD ["node", "server.js"]
