FROM node:20-alpine AS dependencies
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev



FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules


COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

STOPSIGNAL SIGTERM
CMD ["node", "src/server.js"]
