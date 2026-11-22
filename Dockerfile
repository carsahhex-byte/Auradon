FROM node:24-alpine AS build
WORKDIR /app
COPY package.json index.html ./
COPY src ./src
COPY scripts ./scripts
COPY public ./public
RUN npm run build:production

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8788
ENV AURADON_ACCOUNT_DB_PATH=/data/auradon.sqlite
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node server ./server
COPY --from=build --chown=node:node /app/dist ./dist
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8788
CMD ["npm", "run", "multiplayer"]
