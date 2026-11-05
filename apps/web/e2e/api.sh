#!/usr/bin/env bash
# Starts the API for the Playwright tests (playwright.config.ts runs
# this). It gets its own database, dsek_e2e, next to the dev one: dropped,
# migrated and seeded on every run, so the tests write freely and never
# touch the dev data. Port 8091, so it runs beside a dev API on 8090.
set -euo pipefail
cd "$(dirname "$0")/../../api"

# The dev database's server (the same default as apps/api/.env).
base="${POSTGRES_URL:-postgresql://postgres:postgres@localhost:5432/dsek}"
base="${base%%\?*}"
server="${base%/*}"

sql() {
  if command -v psql >/dev/null; then
    psql "$server/postgres" -v ON_ERROR_STOP=1 -qc "$1"
  else
    docker exec dsek-db psql -U postgres -v ON_ERROR_STOP=1 -qc "$1"
  fi
}
sql "DROP DATABASE IF EXISTS dsek_e2e WITH (FORCE)"
sql "CREATE DATABASE dsek_e2e"

# Set here, so they win over apps/api/.env. Search, PDF text, the link
# shortener and tracing are off; auth and storage are mocked.
export POSTGRES_URL="$server/dsek_e2e?sslmode=disable"
export ADDR=":8091"
export PUBLIC_GO_BACKEND_URL="http://localhost:8091"
export PUBLIC_FRONTEND_URL="http://localhost:4173"
export AUTH_MOCK=true
export STORAGE_MOCK=true
export MEILISEARCH_HOST=""
export POPPLER_SERVER_URL=""
export SHLINK_ENDPOINT=""
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=""
export OTEL_EXPORTER_OTLP_ENDPOINT=""

go tool migrate up
go tool seed
exec go run ./cmd/api
