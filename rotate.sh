#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

NEW_PASSWORD="app-$(openssl rand -hex 8)"
DB_NAME="market"

echo "1. ALTER ROLE in Postgres…"
docker compose exec -T db psql -U admin -d market \
  -c "ALTER ROLE app_user WITH PASSWORD '${NEW_PASSWORD}';" >/dev/null

echo "2. Update file with secret"
printf '%s' "${NEW_PASSWORD}" > secrets/db_password

echo "3. Close old connections for app_user…"
docker compose exec -T db psql -U admin -d "${DB_NAME}" -tA \
  -c "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE usename = 'app_user';"

echo "Ready: new password ${NEW_PASSWORD:0:6}"
