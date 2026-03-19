#!/bin/bash
set -euo pipefail

echo "Running database migrations..."

cd "$(dirname "$0")/../../backend"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

npx drizzle-kit migrate

echo "Migrations complete."
