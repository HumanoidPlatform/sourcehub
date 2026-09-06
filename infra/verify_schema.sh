#!/bin/sh
# Does db/*.sql still describe the same database the migrations produce?
#
# The two paths exist for different situations — db/*.sql builds a fresh volume,
# Alembic evolves one that already holds data (Makefile) — and nothing forces
# them to agree. A change landing in one and not the other is silent: fresh
# installs and existing databases simply diverge, and you find out much later.
#
# So: build a throwaway database from db/*.sql, dump both schemas, diff.
#
# Lives in infra/, NOT db/: the postgres entrypoint executes every .sh it finds
# in /docker-entrypoint-initdb.d, so a script in db/ would run itself as part of
# the very bootstrap it exists to check.
#
# alembic_version is excluded — it exists only where migrations have run, which
# is the one difference that is supposed to be there.
set -eu

# Run from the repo root and keep paths relative: an absolute MSYS path
# (/c/Users/...) reaches docker compose on Windows as a bad C: path.
cd "$(dirname "$0")/.."
COMPOSE="docker compose -f infra/compose.yaml"
SCRATCH=sourcehub-schemacheck
OUT="${TMPDIR:-/tmp}"
DUMP="pg_dump -U postgres -d sourcehub --schema-only --no-owner --no-privileges --exclude-table=alembic_version"

# pg_dump 16.15 wraps its output in restrict/unrestrict meta-commands carrying
# a fresh random token every run, so two identical schemas differ on those two
# lines alone. Drop them before comparing.
strip_nonce() { sed -e '/^.restrict /d' -e '/^.unrestrict /d'; }

cleanup() { docker rm -f "$SCRATCH" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "building a scratch database from db/*.sql ..."
docker run -d --name "$SCRATCH" \
  -e POSTGRES_DB=sourcehub -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C" \
  -v "$(pwd)/db:/docker-entrypoint-initdb.d:ro" \
  postgres:16-alpine >/dev/null

# The entrypoint runs db/*.sql on a local socket BEFORE opening the port, so
# pg_isready alone would race the bootstrap. Wait for it to say it is done.
i=0
until docker logs "$SCRATCH" 2>&1 | grep -q "PostgreSQL init process complete"; do
  i=$((i + 1))
  if [ "$i" -gt 180 ]; then
    echo "scratch database did not finish building:"
    docker logs --tail 30 "$SCRATCH"
    exit 1
  fi
  sleep 1
done
until docker exec "$SCRATCH" pg_isready -U postgres -d sourcehub >/dev/null 2>&1; do sleep 1; done

docker exec "$SCRATCH" $DUMP | strip_nonce > "$OUT/sourcehub-schema-fresh.sql"
$COMPOSE exec -T -e PGPASSWORD=postgres postgres $DUMP | strip_nonce > "$OUT/sourcehub-schema-live.sql"

if diff -u "$OUT/sourcehub-schema-fresh.sql" "$OUT/sourcehub-schema-live.sql"; then
  echo "  schemas match — db/*.sql and the running database agree"
else
  echo ""
  echo "  DRIFT. Left is a fresh db/*.sql build, right is your running database."
  echo "  Something landed in one path and not the other: every schema change"
  echo "  belongs in BOTH db/*.sql and a migration."
  exit 1
fi
