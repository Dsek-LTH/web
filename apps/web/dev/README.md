# Development scripts

- `generate_api_types.ts` (`pnpm generate:api`) regenerates
  `src/lib/api/schema.d.ts` from the backend's OpenAPI document
  (`go run ./cmd/openapi` in `apps/api`).
- `check_translations.sh` (`pnpm check-translations`) checks that every
  translation key exists in both languages.
