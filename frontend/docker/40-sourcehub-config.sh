#!/bin/sh
# Fill in frontend/nginx.conf for wherever this image runs.
#
# nginx's own entrypoint runs every executable *.sh in /docker-entrypoint.d/,
# in name order, before it starts nginx. This one reads the template the
# Dockerfile put in /etc/nginx/sourcehub/ and writes the real config.
#
# Four settings, each an environment variable. The DEFAULTS ARE THE VM'S
# COMPOSE NETWORK, so the VM sets none of them and behaves exactly as before:
#
#   API_UPSTREAM     where /api/ and /health go      default http://api:8000
#   API_HOST_HEADER  the Host the API receives       default $host (the browser's)
#   API_RESOLVER     the DNS server nginx asks        default the first nameserver
#                                                     in /etc/resolv.conf (127.0.0.11
#                                                     on a Docker network)
#   REAL_IP_FROM     who may assert X-Forwarded-For   default 172.16.0.0/12 192.168.0.0/16
#
# Outside Docker, API_UPSTREAM must be a FULLY QUALIFIED name. nginx's resolver
# asks for the name literally and ignores the search domains in
# /etc/resolv.conf, so a short name that works for curl can fail for nginx.
# Docker answers short names itself, which is why the default can be "api".
#
#   Azure Container Apps (infra/deploy/STAGING.md):
#     API_UPSTREAM=http://<api-app>.internal.<environment default domain>
#     API_HOST_HEADER=<api-app>.internal.<environment default domain>
#                     (the platform's proxy picks the app from the Host header)
#     REAL_IP_FROM=0.0.0.0/0 (the platform's proxy is the only way in)
#   Kubernetes:
#     API_UPSTREAM=http://<api-service>.<namespace>.svc.cluster.local:8000
#     API_HOST_HEADER and REAL_IP_FROM as the ingress requires
#

# Kept out of /etc/nginx/templates/: the stock 20-envsubst script would treat
# every $variable in the template as an environment variable.
set -eu

TEMPLATE=/etc/nginx/sourcehub/default.conf.template
OUT=/etc/nginx/conf.d/default.conf
REAL_IP=/etc/nginx/sourcehub/real-ip.conf

API_UPSTREAM="${API_UPSTREAM:-http://api:8000}"
API_HOST_HEADER="${API_HOST_HEADER:-\$host}"
REAL_IP_FROM="${REAL_IP_FROM:-172.16.0.0/12 192.168.0.0/16}"
if [ -z "${API_RESOLVER:-}" ]; then
  API_RESOLVER=$(awk '$1 == "nameserver" { print $2; exit }' /etc/resolv.conf)
fi
case "$API_RESOLVER" in
  *:*) API_RESOLVER="[$API_RESOLVER]" ;;  # nginx wants an IPv6 address in brackets
esac

# Each value lands inside an nginx directive and a sed expression. Refuse
# anything that could end the directive or the expression early: a
# misconfigured container should stop here, loudly, not serve a broken proxy.
for pair in "API_UPSTREAM=$API_UPSTREAM" "API_HOST_HEADER=$API_HOST_HEADER" "API_RESOLVER=$API_RESOLVER"; do
  case "${pair#*=}" in
    "" | *[[:space:]\;\|\&\\\"\'\{\}]*)
      echo "$0: ${pair%%=*} is empty or contains a character nginx would misread: '${pair#*=}'" >&2
      exit 1 ;;
  esac
done

: > "$REAL_IP"
for cidr in $REAL_IP_FROM; do
  case "$cidr" in
    *[!0-9a-fA-F.:/]*) echo "$0: REAL_IP_FROM holds something that is not an address or range: '$cidr'" >&2; exit 1 ;;
  esac
  printf 'set_real_ip_from %s;\n' "$cidr" >> "$REAL_IP"
done

# | as the sed delimiter: a value may contain / but, as checked above, never |
sed -e "s|__API_UPSTREAM__|$API_UPSTREAM|g" \
    -e "s|__API_HOST_HEADER__|$API_HOST_HEADER|g" \
    -e "s|__API_RESOLVER__|$API_RESOLVER|g" \
    "$TEMPLATE" > "$OUT"

if grep -q "__API_" "$OUT"; then
  echo "$0: a placeholder was left in $OUT" >&2
  exit 1
fi

echo "$0: /api/ -> $API_UPSTREAM (Host $API_HOST_HEADER, resolver $API_RESOLVER); X-Forwarded-For trusted from: $REAL_IP_FROM"
