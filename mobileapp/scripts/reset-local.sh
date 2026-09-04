#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "This will delete only the Cosaarthi mobile local Postgres and MinIO volumes."
echo "It will not touch SourceHub web containers or data."
read -r -p "Type RESET to continue: " answer

if [[ "$answer" != "RESET" ]]; then
  echo "Reset cancelled."
  exit 0
fi

docker compose -f "$ROOT_DIR/infra/compose.yaml" --env-file "$ROOT_DIR/infra/.env" down -v
echo "Cosaarthi mobile local data was reset. Run ./scripts/setup-local.sh to rebuild it."

