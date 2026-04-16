# Fuel App Server

## Stack

- Node.js + Express + Socket.IO
- Sequelize + SQLite

## Environment

Copy `.env.example` to `.env` and set:

- `NODE_ENV=production`
- `PORT=5000`
- `JWT_SECRET=<secret>`
- `SQLITE_PATH=/data/database.sqlite` (or local path)
- `CORS_ORIGINS=http://localhost:8080`
- `SOCKET_CORS_ORIGINS=http://localhost:8080`

## Run locally

```bash
npm ci
npm run dev
```

## Run in Docker

Use project root compose:

```bash
docker compose up --build
```