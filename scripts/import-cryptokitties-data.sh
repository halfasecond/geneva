#!/usr/bin/env bash
# Import legacy cryptokitties BSON dumps into Geneva Mongo.
#
# Dumps live at ~/cryptosystems/ (from the old cryptosystems indexer).
# Legacy kitty.family server/index.js documents the same workflow.
#
# Usage:
#   ./scripts/import-cryptokitties-data.sh --births-only   # family tree (~2 min)
#   ./scripts/import-cryptokitties-data.sh --events        # full event log (~30+ min, 9.6GB)
#   ./scripts/import-cryptokitties-data.sh --owners        # owner balances
#   ./scripts/import-cryptokitties-data.sh --all           # everything
#
# After import, set VITE_ENABLE_INDEXER=false in src/server/.env and restart the server.
# The live subscription will pick up new blocks from max(ck_events.blockNumber).

set -euo pipefail

CK_DATA_DIR="${CK_DATA_DIR:-$HOME/cryptosystems}"
MONGO_CONTAINER="${MONGO_CONTAINER:-geneva-mongo}"
MONGO_DB="${MONGO_DB:-geneva}"

IMPORT_BIRTHS=false
IMPORT_EVENTS=false
IMPORT_OWNERS=false

for arg in "$@"; do
  case "$arg" in
    --births-only) IMPORT_BIRTHS=true ;;
    --events)      IMPORT_EVENTS=true ;;
    --owners)      IMPORT_OWNERS=true ;;
    --all)         IMPORT_BIRTHS=true; IMPORT_EVENTS=true; IMPORT_OWNERS=true ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)"
      exit 1
      ;;
  esac
done

if ! $IMPORT_BIRTHS && ! $IMPORT_EVENTS && ! $IMPORT_OWNERS; then
  echo "Nothing selected. For kitty.family dev, start with: $0 --births-only"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$MONGO_CONTAINER"; then
  echo "Mongo container '$MONGO_CONTAINER' is not running."
  exit 1
fi

restore() {
  local src_file="$1"
  local collection="$2"
  local remote="/tmp/$(basename "$src_file")"

  if [[ ! -f "$src_file" ]]; then
    echo "Missing: $src_file"
    exit 1
  fi

  local size
  size=$(du -h "$src_file" | cut -f1)
  echo "→ $collection  ($size)  from $(basename "$src_file")"

  docker cp "$src_file" "$MONGO_CONTAINER:$remote"
  docker exec "$MONGO_CONTAINER" mongorestore \
    --quiet \
    --db="$MONGO_DB" \
    --collection="$collection" \
    --drop \
    "$remote"
  docker exec "$MONGO_CONTAINER" rm -f "$remote"
}

echo "Importing into $MONGO_DB on $MONGO_CONTAINER from $CK_DATA_DIR"
echo "(stop the Geneva server first to avoid indexer conflicts)"
echo ""

if $IMPORT_EVENTS; then
  restore "$CK_DATA_DIR/ck_events.bson" "ck_events"
fi

if $IMPORT_BIRTHS; then
  # Legacy ck_births → Geneva ck_nfts (same schema, strict:false)
  restore "$CK_DATA_DIR/ck_births.bson" "ck_nfts"
fi

if $IMPORT_OWNERS; then
  restore "$CK_DATA_DIR/ck_owners.bson" "ck_owners"
fi

echo ""
docker exec "$MONGO_CONTAINER" mongosh "$MONGO_DB" --quiet --eval '
  ["ck_events","ck_nfts","ck_owners"].forEach(c => {
    const n = db[c].estimatedDocumentCount();
    print(c + ": " + n.toLocaleString());
  });
  const latest = db.ck_events.findOne({}, {blockNumber:1, _id:0}, {sort:{blockNumber:-1}});
  if (latest) print("latest event block: " + latest.blockNumber);
'

echo ""
echo "Next steps:"
echo "  1. Set VITE_ENABLE_INDEXER=false in src/server/.env"
echo "  2. Restart the server (subscription-only for new blocks)"
if $IMPORT_EVENTS && ! $IMPORT_BIRTHS; then
  echo "  3. Rebuild state: yarn ck:rebuild"
fi
if $IMPORT_BIRTHS && ! $IMPORT_EVENTS; then
  echo "  3. Family tree is ready — test GET /cryptokitties/family?search=id:3845"
fi