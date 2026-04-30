#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR="${STUDIO_DATA_DIR:-$(pwd)/data}"
BACKUP_DIR="${BACKUP_DIR:-$(pwd)/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Data directory not found: $SOURCE_DIR"
  exit 1
fi

ARCHIVE_PATH="$BACKUP_DIR/studio-data-$STAMP.tar.gz"
tar -czf "$ARCHIVE_PATH" -C "$SOURCE_DIR" .

echo "Backup created: $ARCHIVE_PATH"
