# Development scripts

- `setup_db.sh` starts the local services (`docker compose up -d`), waits for
  PostgreSQL, then runs the backend's migrations and seed (`pnpm migrate`,
  `pnpm seed`). The seed wipes the local database first.
- `generate_api_types.ts` (`pnpm generate:api`) regenerates
  `src/lib/api/schema.d.ts` from the backend's OpenAPI document
  (`go run ./cmd/openapi` in `apps/backend`).
- `check_translations.sh` (`pnpm check-translations`) checks that every
  translation key exists in both languages.
