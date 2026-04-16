FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/. .

ENV NODE_ENV=production
ENV PORT=5000
ENV SQLITE_PATH=/data/database.sqlite

EXPOSE 5000

CMD ["node", "server.js"]
