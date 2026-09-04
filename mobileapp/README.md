# Cosaarthi Data Platform Mobile Stack

Standalone local development for the Cosaarthi mobile app, backend API, database, and object storage.

## Structure

- `app/` - existing Expo mobile app, now branded as Cosaarthi and wired for real API mode.
- `backend/` - mobile-only FastAPI API for auth, Crowd work, tasks, uploads, notifications, and submissions.
- `database/` - mobile PostgreSQL init and setup notes.
- `infra/` - mobile-only Docker Compose for Postgres and MinIO with unique container names and ports.
- `scripts/` - setup and reset helpers.

## Local Setup

```sh
cd mobileapp
npm run setup
npm run backend:dev
```

In another terminal:

```sh
cd mobileapp
npm run app:start
```

`npm run setup` creates ignored local `.env` files, starts Postgres on `55432`, starts MinIO on `59000`/`59001`, applies Alembic migrations, seeds `TASK-MINIO-5`, and configures app/backend local endpoints with the detected Mac LAN IP when available. For physical iPhone testing, the app must use the Mac LAN IP, not `localhost`.

## Verification

```sh
cd mobileapp
npm run typecheck
npm run lint
npm run test
npm run expo-doctor
npm run backend:test
npm run verify:local
```

`verify:local` signs in as the seeded Crowd Worker, presigns 5 image uploads, PUTs those images to MinIO, confirms them with the backend, and submits `TASK-MINIO-5`.
