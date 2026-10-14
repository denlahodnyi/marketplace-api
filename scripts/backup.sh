#!/usr/bin/env bash

BACKUP_DIR="$(pwd)/backups"
DUMP_FILE="backup_$(date "+%d.%m.%Y").dump"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-market}"

echo "✓ Create backups dir"
mkdir -p "$BACKUP_DIR"
echo "✓ Run pg_dump"
docker compose exec -T db pg_dump -U $DB_USER -d $DB_NAME -Fc > "$BACKUP_DIR/$DUMP_FILE" || exit 1
echo "✓ New dump ready -> $BACKUP_DIR/$DUMP_FILE | Size:$(du -h "$BACKUP_DIR/$DUMP_FILE" | cut -f1)"
