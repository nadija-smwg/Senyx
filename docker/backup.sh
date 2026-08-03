#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups"
FILENAME="senyx-erp-${TIMESTAMP}.dump"

echo "[$(date)] Starting database backup..."

pg_dump \
  --format=custom \
  --compress=9 \
  --no-owner \
  --file="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup created: ${FILENAME}"

# Cleanup: keep last 30 daily backups
cd ${BACKUP_DIR}
ls -t senyx-erp-*.dump | tail -n +31 | xargs -r rm
echo "[$(date)] Old backups cleaned up"
