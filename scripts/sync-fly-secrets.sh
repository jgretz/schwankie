#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: sync-fly-secrets.sh <app-dir> <fly-app-name>}"
FLY_APP="${2:?Usage: sync-fly-secrets.sh <app-dir> <fly-app-name>}"
ENV_FILE="$APP_DIR/.env.production"

# Vars managed elsewhere (fly.toml [env] or build args)
SKIP_VARS="NODE_ENV|PORT|HOST"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

echo "Syncing secrets from $ENV_FILE to Fly app: $FLY_APP"

pairs=()
while IFS= read -r line || [ -n "$line" ]; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  name="${line%%=*}"
  value="${line#*=}"

  if [[ "$name" =~ ^($SKIP_VARS)$ ]]; then
    echo "  skip: $name (managed elsewhere)"
    continue
  fi

  echo "  sync: $name"
  pairs+=("$name=$value")
done < "$ENV_FILE"

if [ ${#pairs[@]} -eq 0 ]; then
  echo "No secrets to sync."
  exit 0
fi

fly secrets set "${pairs[@]}" --app "$FLY_APP"
echo "Done. ${#pairs[@]} secrets synced."
