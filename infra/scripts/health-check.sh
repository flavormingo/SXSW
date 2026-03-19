#!/bin/bash
set -euo pipefail

API_URL="${API_BASE_URL:-http://localhost:3000}"

response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" --max-time 5)

if [ "$response" = "200" ]; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed: HTTP $response"
  exit 1
fi
