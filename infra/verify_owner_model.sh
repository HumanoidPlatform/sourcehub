#!/bin/sh
# Does the schema work on a managed PostgreSQL server, where nobody is a superuser?
#
# Azure Flexible Server, AWS RDS, Google Cloud SQL, Supabase and Neon all give
# you an admin login that is NOT a superuser. Some of those admins may still
# skip row-level security (Azure's does on PostgreSQL 18: BYPASSRLS), many
# cannot; this script builds the stricter case, an admin that can do neither.
# Dev compose and the old VM run everything as a superuser, which hides
# whatever depends on one (db/270_managed_postgres.sql tells that story). So
# this builds the database the managed way and checks the things that break
# when it is built wrong.
#
# In a throwaway container (nothing else is touched):
#   1. "cloudadmin" plays the provider's admin: LOGIN, CREATEROLE, CREATEDB,
#      NOT superuser, NO BYPASSRLS. It owns the database appdb.
#   2. cloudadmin runs infra/db/managed_setup.sql, then the schema bundle, the
#      seed and the demo seed, exactly as the Azure steps in
#      infra/deploy/README.md say.
#   3. A small fixture: two clients, one completed contract each with the same
#      partner, one client storage destination.
#   4. Checks, as sourcehub_app with each context the API would set.
#   5. The API's login guard and the Alembic preflight, both ways round.
#
# Usage (Git Bash or any POSIX shell, Docker running, backend/.venv installed):
#   sh infra/verify_owner_model.sh
# To test another bundle (say, an older commit's):
#   SCHEMA_SQL=/path/schema.sql SEED_SQL=/path/seed.sql sh infra/verify_owner_model.sh
set -eu

# See infra/verify_schema.sh: Git Bash rewrites unix-looking paths otherwise.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

cd "$(dirname "$0")/.."
ROOT=$(pwd)
SCRATCH=sourcehub-ownercheck
PORT="${OWNERCHECK_PORT:-5434}"
ADMIN=cloudadmin
ADMIN_PW=cloudadmin-local-only
APP_PW=app-local-only

if [ -x backend/.venv/Scripts/python.exe ]; then PY="$ROOT/backend/.venv/Scripts/python.exe"
elif [ -x backend/.venv/bin/python ]; then PY="$ROOT/backend/.venv/bin/python"
else PY=python3; fi

if [ -z "${SCHEMA_SQL:-}" ]; then
  sh infra/bundle_schema.sh >/dev/null
  SCHEMA_SQL=build/schema.sql
  SEED_SQL=build/seed.sql
fi

cleanup() { docker rm -f "$SCRATCH" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "starting a scratch server on 127.0.0.1:$PORT ..."
docker run -d --name "$SCRATCH" -p "127.0.0.1:$PORT:5432" \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C" \
  postgres:16-alpine >/dev/null
# The entrypoint's first server listens on a socket only; TCP answering means
# the real one is up.
i=0
until docker exec "$SCRATCH" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do
  i=$((i + 1)); [ "$i" -gt 90 ] && { docker logs --tail 20 "$SCRATCH"; exit 1; }
  sleep 1
done

as_provider() { docker exec -i "$SCRATCH" psql -X -q -v ON_ERROR_STOP=1 -U postgres "$@"; }
as_admin() { docker exec -i -e PGPASSWORD="$ADMIN_PW" -e "PGOPTIONS=-c client_min_messages=warning" "$SCRATCH" psql -X -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -U "$ADMIN" -d appdb "$@"; }
as_app() { docker exec -i -e PGPASSWORD="$APP_PW" "$SCRATCH" psql -X -q -At -v ON_ERROR_STOP=1 -h 127.0.0.1 -U sourcehub_app -d appdb "$@"; }

echo "the provider creates an admin login that is not a superuser ..."
as_provider -d postgres >/dev/null <<SQL
CREATE ROLE $ADMIN LOGIN PASSWORD '$ADMIN_PW' CREATEROLE CREATEDB NOSUPERUSER NOBYPASSRLS;
CREATE DATABASE appdb OWNER $ADMIN;
SQL

echo "the admin runs managed_setup.sql, then the bundle ..."
as_admin < infra/db/managed_setup.sql >/dev/null
as_admin -c "ALTER ROLE sourcehub_app PASSWORD '$APP_PW'" >/dev/null
as_admin < "$SCHEMA_SQL" >/dev/null
as_admin < "$SEED_SQL" >/dev/null
as_admin < db/910_seed_demo.sql >/dev/null

echo "adding a two-client fixture ..."
as_admin >/dev/null <<'SQL'
DO $$
DECLARE
  acme uuid := (SELECT id FROM organisation WHERE name = 'Acme Retail Analytics');
  voltra uuid := (SELECT id FROM organisation WHERE name = 'Voltra Mobility');
  ns uuid := (SELECT id FROM organisation WHERE name = 'NorthStar Delivery Partners');
  st uuid; rid uuid; pid uuid; cid uuid; client uuid; k int := 0;
BEGIN
  INSERT INTO storage_target (owner_org_id, label, provider, bucket, secret)
  VALUES (acme, 'Acme bucket', 'azure_blob', 'acme', '{"account_name":"x","account_key":"eA=="}')
  RETURNING id INTO st;
  FOREACH client IN ARRAY ARRAY[acme, voltra] LOOP
    k := k + 1;
    INSERT INTO request (reference_code, client_org_id, title, category, status, published_at)
    VALUES ('RFP-OC' || k, client, 'Owner check ' || k, 'image', 'completed', now() - interval '60 days')
    RETURNING id INTO rid;
    INSERT INTO proposal (reference_code, request_id, partner_org_id, price, duration_days, methodology, status)
    VALUES ('PRO-OC' || k, rid, ns, 1000, 10, 'Owner check.', 'accepted') RETURNING id INTO pid;
    INSERT INTO contract (reference_code, request_id, proposal_id, client_org_id, partner_org_id, value,
                          status, started_at, delivered_at, completed_at, storage_target_id)
    VALUES ('CTR-OC' || k, rid, pid, client, ns, 1000, 'completed', now() - interval '50 days',
            now() - interval '20 days', now() - interval '19 days',
            CASE WHEN client = acme THEN st END)
    RETURNING id INTO cid;
    INSERT INTO rating (contract_id, from_org_id, to_org_id, score, comment)
    VALUES (cid, client, ns, 5, 'Owner check.');
  END LOOP;
END
$$;
SQL

ACME=$(as_admin -At -c "SELECT id FROM organisation WHERE name = 'Acme Retail Analytics'")
VOLTRA=$(as_admin -At -c "SELECT id FROM organisation WHERE name = 'Voltra Mobility'")
NS=$(as_admin -At -c "SELECT id FROM organisation WHERE name = 'NorthStar Delivery Partners'")
AGG=$(as_admin -At -c "SELECT id FROM organisation WHERE kind = 'aggregator' ORDER BY reference_code LIMIT 1")
ACME_CTR=$(as_admin -At -c "SELECT id FROM contract WHERE reference_code = 'CTR-OC1'")

# $1 = org, $2 = role, $3 = user: the three set_config calls db/session.py makes
ctx() {
  printf '%s\n' "SELECT set_config('app.org_id', '$1', true), set_config('app.role', '$2', true), set_config('app.user_id', '${3:-}', true) \\g /dev/null"
}

FAILED=0
check() {  # name, expected, actual
  if [ "$2" = "$3" ]; then echo "  PASS  $1"
  else echo "  FAIL  $1: expected [$2], got [$3]"; FAILED=$((FAILED + 1)); fi
}

echo
echo "checks, as sourcehub_app:"

check "no table is FORCEd" "0" \
  "$(as_admin -At -c "SELECT count(*) FROM pg_class WHERE relforcerowsecurity")"

check "sign-in finds the seeded admin before anyone is signed in" "1" \
  "$(as_app -c "SELECT count(*) FROM authenticate_lookup('admin@sourcehub.local')")"

check "sign-in finds a demo client" "1" \
  "$(as_app -c "SELECT count(*) FROM authenticate_lookup('client@acme.example')")"

check "Acme's session sees only Acme's contract" "1" \
  "$(printf '%s\n' "BEGIN;" "$(ctx "$ACME" client)" "SELECT count(*) FROM contract;" "COMMIT;" | as_app)"

check "a session with no organisation sees no contract" "0" \
  "$(as_app -c "SELECT count(*) FROM contract")"

check "NorthStar's record counts both clients' contracts, asked by Acme" "2|2" \
  "$(printf '%s\n' "BEGIN;" "$(ctx "$ACME" client)" \
     "SELECT contracts_completed || '|' || rating_count FROM partner_performance(ARRAY['$NS']::uuid[]);" "COMMIT;" | as_app)"

check "the same record, asked by Voltra" "2|2" \
  "$(printf '%s\n' "BEGIN;" "$(ctx "$VOLTRA" client)" \
     "SELECT contracts_completed || '|' || rating_count FROM partner_performance(ARRAY['$NS']::uuid[]);" "COMMIT;" | as_app)"

printf '%s\n' "BEGIN;" "$(ctx "$ACME" client)" \
  "SELECT write_audit_event('ownercheck.first', 'owner check, Acme') \\g /dev/null" "COMMIT;" | as_app
printf '%s\n' "BEGIN;" "$(ctx "$VOLTRA" client)" \
  "SELECT write_audit_event('ownercheck.second', 'owner check, Voltra') \\g /dev/null" "COMMIT;" | as_app
check "two organisations' audit events chain onto one head" "t" \
  "$(as_admin -At -c "SELECT b.prev_hash = a.row_hash FROM audit_event a, audit_event b
                      WHERE a.event_type = 'ownercheck.first' AND b.event_type = 'ownercheck.second'")"

check "a worker session resolves the client's storage for a capture" "t" \
  "$(printf '%s\n' "BEGIN;" "$(ctx "$AGG" worker "00000000-0000-0000-0000-000000000001")" \
     "SELECT (storage_destination_for_contract('$ACME_CTR')).id IS NOT NULL;" "COMMIT;" | as_app)"

check "the API cannot edit or delete a sent message" "false|false" \
  "$(as_app -c "SELECT has_table_privilege('rfp_message', 'UPDATE') || '|' || has_table_privilege('rfp_message', 'DELETE')")"

check "the API may close a thread but not rewrite who it is between" "true|false" \
  "$(as_app -c "SELECT has_column_privilege('rfp_thread', 'closed_at', 'UPDATE') || '|' || has_column_privilege('rfp_thread', 'client_org_id', 'UPDATE')")"

check "the API cannot delete an assignment" "f" \
  "$(as_app -c "SELECT has_table_privilege('task_assignment', 'DELETE')")"

check "the 100th code keeps all three digits" "WKR-100" \
  "$(as_admin -At -c "SELECT setval('seq_ref_worker', 99)" -c "SELECT next_reference_code('WKR', 'seq_ref_worker')" | tail -1)"

check "partitions run to 2029" "2029-01-01" \
  "$(as_admin -At -c "SELECT max(substring(pg_get_expr(c.relpartbound, c.oid) FROM 'TO \(''([0-9-]+)')) FROM pg_class c WHERE c.relispartition AND c.relname LIKE 'asset_2%'")"

echo
echo "the API's login guard and the Alembic preflight:"
APP_URL="postgresql+asyncpg://sourcehub_app:$APP_PW@127.0.0.1:$PORT/appdb"
ADMIN_URL="postgresql+asyncpg://$ADMIN:$ADMIN_PW@127.0.0.1:$PORT/appdb"
OUT="${TMPDIR:-/tmp}/sourcehub-ownercheck.log"
# A refusal only counts when it is THE refusal: any other failure (a bad URL,
# a missing package) prints "error" and fails the check.
guard() {
  if (cd backend && DATABASE_URL="$1" JWT_SECRET=ownercheck "$PY" -c \
      "import asyncio; from sourcehub.db import guard; asyncio.run(guard.assert_safe_login())" \
      >"$OUT" 2>&1); then echo started
  elif grep -q "UnsafeDatabaseLoginError" "$OUT"; then echo refused
  else echo error; fi
}
migrate() {
  url=$1; shift
  if (cd backend && DATABASE_ADMIN_URL="$url" DATABASE_URL="$APP_URL" JWT_SECRET=ownercheck \
      "$PY" -m alembic "$@" >"$OUT" 2>&1); then echo ran
  elif grep -q "belong to" "$OUT"; then echo refused
  else echo error; fi
}
check "the API starts as sourcehub_app" "started" "$(guard "$APP_URL")"
check "the API refuses to start as the admin" "refused" "$(guard "$ADMIN_URL")"
check "alembic stamps as the admin" "ran" "$(migrate "$ADMIN_URL" stamp head)"
check "alembic upgrades as the admin" "ran" "$(migrate "$ADMIN_URL" upgrade head)"
check "alembic refuses to run as sourcehub_app" "refused" "$(migrate "$APP_URL" current)"
check "the database is at the latest migration" "$(cd backend && "$PY" -m alembic heads 2>/dev/null | cut -d' ' -f1)" \
  "$(as_admin -At -c "SELECT version_num FROM alembic_version")"

echo
if [ "$FAILED" -eq 0 ]; then
  echo "  every check passed: this schema works on a managed server"
else
  echo "  $FAILED check(s) failed"
  exit 1
fi
