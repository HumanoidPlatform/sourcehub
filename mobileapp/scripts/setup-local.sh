#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT_DIR/infra/compose.yaml" --env-file "$ROOT_DIR/infra/.env")
PYTHON_BIN="${PYTHON_BIN:-python3.12}"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required tool: $1" >&2
    exit 1
  fi
}

copy_if_missing() {
  local src="$1"
  local dst="$2"
  if [[ ! -f "$dst" ]]; then
    cp "$src" "$dst"
    echo "Created ${dst#$ROOT_DIR/}"
  fi
}

wait_for_postgres() {
  local tries=0
  until "${COMPOSE[@]}" exec -T postgres pg_isready -U cosaarthi_mobile_owner -d cosaarthi_mobile >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [[ "$tries" -gt 60 ]]; then
      echo "Postgres did not become healthy." >&2
      "${COMPOSE[@]}" ps
      exit 1
    fi
    sleep 2
  done
}

detect_lan_ip() {
  local ip=""
  if command -v ipconfig >/dev/null 2>&1; then
    ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
    if [[ -z "$ip" ]]; then
      ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
    fi
  fi
  if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  printf "%s" "$ip"
}

configure_lan_defaults() {
  local lan_ip
  local api_url
  lan_ip="$(detect_lan_ip)"
  if [[ -z "$lan_ip" ]]; then
    echo "Could not detect a LAN IP. Edit app/.env and backend/.env before physical iPhone testing."
    return
  fi

  api_url="http://$lan_ip:8001/api/v1"
  if grep -q "^EXPO_PUBLIC_API_URL=" "$ROOT_DIR/app/.env"; then
    perl -0pi -e "s#^EXPO_PUBLIC_API_URL=.*#EXPO_PUBLIC_API_URL=$api_url#m" "$ROOT_DIR/app/.env"
  else
    printf "\nEXPO_PUBLIC_API_URL=%s\n" "$api_url" >> "$ROOT_DIR/app/.env"
  fi
  perl -0pi -e "s/^MINIO_PUBLIC_ENDPOINT=.*/MINIO_PUBLIC_ENDPOINT=$lan_ip:59000/m" "$ROOT_DIR/backend/.env"
  echo "Configured mobile LAN endpoints with $lan_ip. Expo API URL: $api_url"
}

need docker
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Missing $PYTHON_BIN. Install Python 3.12+ or rerun with PYTHON_BIN=/path/to/python3.12." >&2
  exit 1
fi

copy_if_missing "$ROOT_DIR/infra/.env.example" "$ROOT_DIR/infra/.env"
copy_if_missing "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
copy_if_missing "$ROOT_DIR/app/.env.example" "$ROOT_DIR/app/.env"
configure_lan_defaults

"${COMPOSE[@]}" up -d
wait_for_postgres

cd "$ROOT_DIR/backend"
if [[ ! -d .venv ]]; then
  "$PYTHON_BIN" -m venv .venv
fi

. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
alembic upgrade head
python -m cosaarthi_mobile.dev_seed

echo ""
echo "Cosaarthi mobile local stack is ready."
echo "Backend: cd mobileapp/backend && source .venv/bin/activate && uvicorn cosaarthi_mobile.main:app --host 0.0.0.0 --port 8001 --reload"
echo "Expo app: cd mobileapp/app && npm install && npm start"
echo "Verifier: cd mobileapp/backend && source .venv/bin/activate && python scripts/verify_local.py"
