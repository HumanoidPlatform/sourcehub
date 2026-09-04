# Cosaarthi Mobile Database

This database is independent of the SourceHub web database.

Local data lives in the Docker volume created by `mobileapp/infra/compose.yaml`.
Alembic migrations live in `mobileapp/backend/migrations`.

Normal setup:

```bash
cd mobileapp
./scripts/setup-local.sh
```

Destructive local reset:

```bash
cd mobileapp
./scripts/reset-local.sh
./scripts/setup-local.sh
```

The local seed creates `TASK-MINIO-5` and the development Crowd Worker:

- Email: `anita@crowd.in`
- Password source: `mobileapp/backend/.env` (`DEV_SEED_PASSWORD`)

