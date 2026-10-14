# TODO: add secrets storage. All scripts that request DB should start here.
# TODO: use SKIP_VAULT=1 to skip secrets storage (e.g., docker compose up -d --wait EXPORT DB_URL=... EXPORT SKIP_VAULT=1)

echo "(todo) pull secrets from Infisical"
# First arg is a slug (otherwise dev), then shift args position
ENV_SLUG="${1:-dev}"; shift || true
# If args > 0 force "npm run start" as a next args
# [ "$#" -gt 0 ] || set -- npm run start
# # грейдер не має доступу до сховища: значення вже в оточенні
# If SKIP_VAULT=1 then execute args
if [ "${SKIP_VAULT:-0}" = "1" ]; then exec "$@"; fi
# CREDS="$ROOT/.secrets/infisical.env"
