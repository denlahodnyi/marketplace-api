#!/usr/bin/env bash

BACKUP_DIR="$(pwd)/backups"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-market}"
DUMP_FILE=$1

if [[ ! $DUMP_FILE ]]; then
  echo "❌ Pass dump file to the arguments"
  exit 1
fi

if [[ -e "$BACKUP_DIR/$DUMP_FILE" ]]; then
  echo "✓ Backup file exists"
else
  echo "❌ Cannot find backup file"
  exit 1
fi

echo "✓ Measure checksum before restoration"
BEFORE=$(docker compose exec -T db psql -U $DB_USER -d $DB_NAME -Atc \
  "SELECT count(*) || '|' || coalesce(sum(total), 0) FROM orders")
echo "  orders before: $BEFORE  (count|sum(amount))"

echo "✓ Delete existent container and volume"
docker compose --profile drill rm -sf restore >/dev/null 2>&1 || true # &>/dev/null
docker volume rm -f marketplace_restore-db >/dev/null 2>&1 || true

echo "✓ Run clean DB instance"
docker compose --profile drill up -d --wait restore

TABLES_IN_CLEAN=$(docker compose exec -T restore psql -U $DB_USER -d $DB_NAME -Atc \
  "SELECT count(*) FROM pg_tables WHERE tablename = 'orders'")
echo "  'orders' tables count: $TABLES_IN_CLEAN (0 = DB is empty)"
if [ "$TABLES_IN_CLEAN" != "0" ]; then
  echo "  ❌ DB is not empty; cannot continue drill"; exit 1
fi

echo "✓ Restore"
T0=$(date +%s)
docker compose exec -T restore pg_restore -U $DB_USER -d $DB_NAME --no-owner < "$BACKUP_DIR/$DUMP_FILE"
RESTORE_EXIT=$?
RESTORE_DURATION=$(echo "$(date +%s) - $T0" | bc)
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$DUMP_FILE" | cut -f1)
echo "  Restoration completed$BACKUP_SIZE in $RESTORE_DURATION seconds with exit code $RESTORE_EXIT"

if [ $RESTORE_EXIT -eq 0 ]; then
  echo "✓ Measure checksum after restoration"
  AFTER=$(docker compose exec -T restore psql -U $DB_USER -d $DB_NAME -Atc \
    "SELECT count(*) || '|' || coalesce(sum(total), 0) FROM orders")
  echo "  orders after restoration: $AFTER"

  if [ "$BEFORE" = "$AFTER" ]; then
    echo "  ✅ MATCH — data matches"
  else
    echo "  ❌ MISMATCH: '$BEFORE' ≠ '$AFTER'"; exit 1
  fi
fi

echo "✓ Cleanup"
docker compose --profile drill rm -sf restore && docker volume rm marketplace_restore-db

exit $RESTORE_EXIT
