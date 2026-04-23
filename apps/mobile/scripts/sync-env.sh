#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$MOBILE_DIR/.env.production"
ENVIRONMENT="${1:-production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

cd "$MOBILE_DIR"
echo "Syncing env vars from .env.production to EAS environment: $ENVIRONMENT"

while IFS= read -r line || [ -n "$line" ]; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  name="${line%%=*}"
  value="${line#*=}"

  # EXPO_PUBLIC_ vars are embedded in the JS bundle anyway
  if [[ "$name" == EXPO_PUBLIC_* ]]; then
    visibility="plaintext"
  else
    visibility="sensitive"
  fi

  echo "  $name ($visibility)"
  eas env:create \
    --environment "$ENVIRONMENT" \
    --name "$name" \
    --value "$value" \
    --visibility "$visibility" \
    --force \
    --non-interactive
done < "$ENV_FILE"

echo "Done."
