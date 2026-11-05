# AGENTS.md

The website of the D-guild (D-sektionen inom TLTH), www.dsek.se: a
SvelteKit frontend and a Go backend. The Go API owns all data, validation
and authorization; the SvelteKit app renders pages and calls it.

## Layout

- `frontend/` - the SvelteKit app (Svelte 5, TypeScript, Tailwind,
  paraglide for sv/en translations in `src/translations`). It has no
  database access of its own.
- `backend/` - the Go API (module `github.com/dsek-lth/web/backend`,
  Go 1.26). `main.go` wires everything; `internal/<domain>` holds one
  package per domain (a `Service` wrapping sqlc's `*db.Queries`);
  `internal/api` is the HTTP layer; `internal/db` is schema, queries,
  migrations and generated code; `cmd/migrate`, `cmd/seed` and
  `cmd/openapi` are commands.
- `poppler-server/` - a small Node service that extracts text from PDFs
  for search.
- `docker-compose.yml` - local Postgres (`dsek-db`), Meilisearch and
  poppler-server. `podman-dev.yaml` is the same for podman.
- `.github/workflows` - CI (`node.js.yml` for the frontend, `go.yml` for
  the backend, `e2e.yml` for the Playwright tests, `api-breaking.yml` for
  breaking API changes) and image builds (`deploy*.yml`: website, backend
  and poppler images). The Kubernetes manifests live in a separate
  repository.

## Running locally

Needs Node 24 (`nvm use` picks it up from `.nvmrc`), pnpm 12 (or
`corepack enable`, which follows `packageManager` in `frontend/package.json`),
Go 1.26 and Docker.

1. `docker compose up -d` (repo root) - Postgres on 5432, Meilisearch on
   7700, poppler on 8800.
2. `cd frontend && pnpm install`, then `pnpm migrate` and `pnpm seed`
   (or `./dev/setup_db.sh`, which does all three). The seed wipes the
   local database and fills it with deterministic fake data.
3. Backend: `cd backend && make dev` (hot reload) or `go run .` - port
   **8090**.
4. Frontend: `cd frontend && pnpm dev` - port **5173**.

Settings come from `frontend/.env` and `backend/.env`. Both are tracked on
purpose: they hold only dev values (no real secrets), so a fresh clone runs
without copying anything. Variables already set in the environment win.
Each file has only what its half reads; the public URLs both need
(`PUBLIC_GO_BACKEND_URL`, `PUBLIC_MINIO_BASE_URL`, ...) are in both.

Mocks, each an explicit opt-in that logs loudly and must never be on in a
deployment:

- `AUTH_MOCK=true` (on in `backend/.env`) - every request is a fixed real
  member (`AUTH_MOCK_STUDENT_ID`, or any member) holding every policy.
  Unset it to log in through Authentik's dev client for real.
- `STORAGE_MOCK=true` - no MinIO: uploads are dropped, listings are
  empty. Needed unless you have MinIO credentials.
- `PUSH_MOCK` - push notifications are logged, not sent, unless it is
  exactly `false`. In-app notifications are always real.

Search needs Meilisearch (without `MEILISEARCH_HOST` it answers 503) and an
index build: `POST /search/sync` as an admin (or `admin/debug`).

The backend logs with `log/slog` to stderr: readable text by default,
JSON with `LOG_FORMAT=json` (deployments), level from `LOG_LEVEL` (`debug`,
`info`, `warn`, `error`). Log with attributes
(`slog.Error("articles: post to Discord", "slug", slug, "err", err)`), not
formatted strings. Every request gets one line with method, route pattern,
status, duration and member.

Tracing (OpenTelemetry, `internal/tracing`) is off unless
`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` (or `OTEL_EXPORTER_OTLP_ENDPOINT`) is
set; `OTEL_SERVICE_NAME` defaults to `dsek-backend`. Spans cover every
request (named by route), every query and every outgoing HTTP call, and
continue the SvelteKit server's trace, so a page load is one trace across
both. Locally: `docker compose --profile tracing up -d` starts Jaeger (UI
on http://localhost:16686); uncomment the endpoint in `backend/.env`. The
frontend's `.env` already points there.

## Commands

Frontend (`frontend/`):

- `pnpm dev`, `pnpm build`
- `pnpm check` (svelte-check), `pnpm lint`, `pnpm format` / `format:fix`
  (Prettier, also covers the root Markdown/YAML and poppler-server),
  `pnpm test` (vitest), `pnpm check-translations`, `pnpm ci-check` (all of
  them)
- `pnpm test:integration` - the Playwright tests (see "End-to-end tests";
  one test: `pnpm test:integration -g "publish an event"`)
- `pnpm generate:api` - regenerate `src/lib/api/schema.d.ts` from the
  running backend's `/openapi.json`. Do this after any API change, with
  the new backend running.
- `pnpm migrate`, `pnpm seed` - shortcuts for the backend commands below

Backend (`backend/`):

- `go build ./...`, `go vet ./...`, `go test ./...` (one test:
  `go test ./... -run TestName`). Tests that need Postgres skip without
  one: the authorization tests (`internal/api/authz_*_test.go`) create,
  migrate and seed their own throwaway database next to `POSTGRES_URL`'s
  and drop it afterwards; `internal/articles` uses the dev database inside a
  rolled-back transaction.
- `make dev` (air), `make format` (goimports + golines/gofumpt - use this,
  not plain gofmt)
- `make generate` - sqlc, after editing `internal/db/schema.sql` or
  `internal/db/queries/*.sql`
- `go tool migrate up` / `down [n]` / `version` / `force <version>`
- `go tool seed` - refuses anything but a local database

Tools (air, sqlc, golines, goimports, gofumpt, migrate, seed) are `tool`
dependencies in `go.mod`, run with `go tool <name>`; nothing is installed
globally.

## How the two halves fit

- **Auth.** Go is the OIDC client (Authentik, PKCE) and the session
  authority: `/auth/login`, `/auth/callback`, `/auth/logout`. The session
  is an encrypted cookie (`dsek_session`, no server-side store), scoped by
  `AUTH_COOKIE_DOMAIN` so both origins get it. Expired sessions refresh
  transparently. Members are only ever created in `/auth/callback`.
- **Identity.** `auth.Middleware` resolves every request to an
  `auth.Identity` (member, roles, policies); a caller without a session is
  an anonymous identity (roles `*`), not a 401. Policies are strings
  (`internal/apinames`) granted to roles or student ids in
  `api_access_policies`. Services call `auth.Require(ctx, policy)` and take
  the acting member from the context, never from a request body.
- **SvelteKit.** `hooks.server.ts` calls `GET /me` with the caller's
  cookies and sets `locals.user` (ids, policies, roles) and
  `locals.member`. Pages read `data.user.policies` only to decide what to
  show; Go makes every real decision.
- **Locale.** The frontend sends `Accept-Language`; every translated field
  comes back as the raw pair (`nameSv`/`nameEn`, for edit forms) plus one
  resolved field (`name`, for display). The frontend never resolves a
  translation itself.

## Conventions

### Go owns validation and authorization

Never reimplement either in TypeScript, even client-side only: the API is
called from the browser and the native app directly, so a TypeScript copy
is either redundant or a rule that drifts.

- Per-resource permissions come back on the resource (`canEdit`,
  `canDelete` computed by the same check the write runs). Flat UI toggles
  may read `user.policies.includes(...)`.
- Pure-proxy mutations (delete, like, attend, dismiss, ...) call Go
  directly from the component - no SvelteKit action, no zod (see
  `news/RemoveArticleDialog.svelte`). Authoring forms may keep a zod schema
  and a server action, but only as instant feedback; Go decides.
- The only checks left in SvelteKit are `/yrka` (it sends an email from
  SvelteKit) and the nollu group manage page (listing groups is public).

### API (Go)

huma (`github.com/danielgtaylor/huma/v2`, `humago` on the stdlib
`ServeMux`), code-first: handlers take and return Go structs and huma
generates the OpenAPI document (`/openapi.json`, browsable at `/docs`),
which is the API reference.

- Paths are plural kebab-case, nested only for sub-resources, with one key
  per resource: `{slug}` (articles, events, songs), `{studentId}`
  (members), `{shortName}` (committees), `{name}` (doors), `{id}`
  otherwise.
- POST on a collection creates (201 + the resource), PUT replaces the
  whole resource (200 + it), DELETE removes (204). No PATCH. Other state
  changes are `POST /{resource}/{key}/{verb}`; the caller's own toggles are
  PUT/DELETE on a noun (`/articles/{slug}/like`,
  `/events/{slug}/attendance`). Lists take `page`/`pageSize`; hidden items
  `includeDeleted`/`onlyDeleted`/`includeUnpublished`.
- Request bodies are `<Thing>Input`; responses are domain-prefixed nouns
  (`NotificationGroup`, not `Group`); paged lists are `<Thing>List`. Never
  leave a body as an anonymous struct (huma would name it `...OutputBody`).
- Errors go through `humaServiceError` (`internal/api/huma_errors.go`):
  404 naming what wasn't found, 422 for a domain's `ErrInvalidInput`, 409
  for conflicts. Add a new domain's sentinel errors to its tables.
- Enums are named Go string types with a `Schema(huma.Registry)` method
  returning `apitypes.EnumSchema(r, "Name", values...)`.
- Every operation has an OperationID, Summary, a Description naming the
  policy it needs, and exactly one tag from `apiTags`
  (`internal/api/config.go`). Every DTO field has a `doc:` tag unless its
  name is in `router_test.go`'s `selfExplanatory` list.
  `go test ./internal/api` enforces all of this.
- Unset fields are omitted (pointer + `omitempty`), never `null`; slices
  always serialize as `[]`. Responses carry no `$schema`.
- Only `GET /salto/{door}`, `POST /search/sync/password` and `/auth/*` are
  plain handlers; raw bodies (ICS, CSV, files) are still huma operations
  (`rawOutput`).
- The API is unversioned and changes only additively: the native app calls
  it directly and old builds stay installed for months. Add optional
  fields and new endpoints; don't remove, rename or tighten anything. To
  replace something, add the new one beside it and remove the old one once
  no app build uses it. CI (`api-breaking.yml`) runs `oasdiff breaking`
  against the base branch's spec (`go run ./cmd/openapi -3.0`); an
  intended break needs the `api-breaking` label.

### Frontend

- Types and the client are generated: `$lib/api/schema.d.ts` and
  `$lib/api/client.ts` (openapi-fetch). Call
  `api.GET("/articles/{slug}", ...)` at the call site; no hand-written
  DTOs or per-endpoint wrappers. Types for API data are
  `components["schemas"][...]` (or a `Pick` of one) without `| null`;
  shared UI components may take small local prop shapes instead.
- Loads are universal (`+page.ts`) by default and pass their own `fetch`
  (`api.GET(..., { fetch })`). Use a server load or action only when it
  needs cookies, `locals`, secrets or a real upload. `.server.ts` code
  calls Go through `serverApi(event)` (`$lib/server/apiClient`), which
  forwards the session cookie both ways - the shared `api` would call Go
  anonymously from the server.
- Pass Go's status and `detail` on when a load fails, not a fixed 500.
- Uploads: send typed bodies with `...multipart` from `$lib/api/client`.
- Pages that still render `<NotImplemented />` have real loads behind
  them; their UI just isn't built.

### End-to-end tests

Playwright, in `frontend/e2e`, run with `pnpm test:integration` (needs the
Postgres container; `pnpm exec playwright install chromium` once). It
starts its own servers and stops them afterwards: a backend on 8091
(`e2e/backend.sh`) on a `dsek_e2e` database it drops, migrates and seeds
every run, with auth and storage mocked, and a production build of the
frontend on 4173 (it rebuilds `build/`). The dev database and dev servers
are left alone.

- `routes.spec.ts` opens every page and fails on an error status, an
  uncaught exception or a console error. Pages without parameters are
  found from `src/routes`, so a new page is covered automatically; add
  pages with parameters to `dynamicRoutes`.
- `publish.spec.ts` writes an article and an event through their forms.

CI runs them in `e2e.yml`, which isn't a required check yet. Keep the
suite to smoke tests and a few flows that matter: detailed UI tests break
with every redesign.

### Adding an endpoint or a domain

1. SQL in `internal/db/queries/<domain>.sql` (named `sqlc.arg()` params,
   explicit column lists), new tables or columns in a migration plus
   `schema.sql`, then `make generate`.
2. Logic in `internal/<domain>` (`Service`, sentinel errors,
   `auth.Require`); DTOs in its `types.go`, shared shapes in
   `internal/apitypes`.
3. Routes in `internal/api/huma_<domain>.go`, registered from
   `NewRouter` (`api.Services`); errors in `huma_errors.go`; a tag in
   `apiTags` for a new domain. New policies go in `internal/apinames`
   (and `All()`, so the seed grants them in dev).
4. Add authorization cases to `internal/api/authz_*_test.go`: who is
   denied, who is allowed, and any owner exception (`e.gate` covers the
   plain "needs policy X" shape).
5. `go test ./internal/api`, restart the backend, `pnpm generate:api`,
   then use it from the frontend.

### Database

pgx + sqlc. `internal/db/schema.sql` is hand-written and describes only
the tables Go uses (sqlc can't be limited to a subset of the migrations);
keep it in sync with the real tables (`docker exec dsek-db psql -U postgres
dsek -c '\d <table>'`) - some columns are camelCase (`"workerId"`,
`"isDisabled"`). Everything else in `internal/db` is generated.

Migrations are `internal/db/migrations/<timestamp>_<name>.up.sql` with a
real `.down.sql`, applied by golang-migrate (`go tool migrate`). The first
one, `20261103200000_baseline`, is the schema Prisma's migrations had built
(no down file); `migrate up` builds a database from nothing, and adopts a
database Prisma migrated by recording the baseline as applied - only if
its `_prisma_migrations` lists exactly the migrations the baseline replaced
(`cmd/migrate/adopt.go`). New migrations get timestamps after the newest
one. Unused tables from removed features (webshop, expenses) are still in
the database on purpose.

### Nollning

`internal/nollning` is the only code that knows the current season and
phase (`off`/`pre_reveal`/`post_reveal`, from `nollning_seasons`); every
other domain asks it. Articles and events belong to a season through
`nollning_season_id` (setting it needs `nollning:content:associate`).
Outside a season everyone gets `member:see_staben`; during one, the season
organizing committee's positions are hidden from those without it.

### Background work and deployment

The backend runs in-process timers: the article announcement sweep
(notifications and the Discord post when a scheduled article goes live)
and the ticket lotteries and offer expiry. Run exactly one replica.
Deployments run `/app/migrate up` before the server starts; the backend
image also contains `/app/seed`, which wipes the database and is only for
PR previews.

## Gotchas

- **huma duplicate schema names**: huma names schemas after the bare Go
  type name, so two packages each defining `Member` panic at startup, not
  at build time. Prefix domain DTOs or share them via `apitypes`;
  `go test ./internal/api` catches it.
- **sqlc positional params**: with several `$N` params of the same type,
  sqlc's struct field order isn't the textual order, so values can
  silently swap. Use `sqlc.arg('name')`. Never `SELECT *`/`RETURNING *`
  (columns map by position against `schema.sql`).
- **`.server.ts` in universal loads**: importing a `.server.ts` file or
  anything under `$lib/server` from a `+page.ts` (even indirectly) breaks
  the client bundle, sometimes as "An impossible situation occurred".
  svelte-check, eslint and SSR curl don't catch it; `pnpm build`, a real
  browser load or `pnpm test:integration` (both) does.
- **Streamed layout data breaks status codes**: returning an unawaited
  promise from a layout load makes SvelteKit stream every page under it,
  and a streamed page is sent with status 200 even when it renders an
  error. Await layout data (in parallel with `Promise.all`).
- **Restarting the backend**: stop it by port
  (`kill $(lsof -ti tcp:8090)`) - `go run`'s binary lives in the build
  cache, so a pattern-based `pkill` can miss it and `pnpm generate:api`
  then reads the old spec.
- **Renaming Go identifiers**: use `gopls rename`; `gofmt -r 'Old -> New'`
  also renames same-named struct fields and selectors.
- **Svelte 5 bindable fallbacks**: `bind:value={undefined}` into a
  `$bindable("")` prop throws; give omitted API fields a fallback
  (`?? ""`) before binding.

## External contracts - don't change these

- `GET /salto/{door}` on the SvelteKit origin (`frontend/src/routes/(app)/salto/[door]`,
  proxying Go's): the university's Salto door system polls this exact URL
  for who may open a door. Its output must stay byte-identical.
- SvelteKit URLs other clients use, kept as thin proxies to Go:
  `/events/subscribe` and `/nollning/events/subscribe` (calendar
  subscriptions), `/api/sync` (the search-index cron job),
  `/api/notifications/uploadToken` (the native app's push token),
  `/api/alarm`, `/api/members/picture/{studentId}`, `/api/openapi.json`,
  `/medals/download-csv`, and the legacy `/events/id/{id}` links (redirect
  to the slug URL).
- `/auth/*` on the backend (registered as Authentik redirect URIs) and
  `GET /me` (called by `hooks.server.ts` on every request).

## Svelte MCP

You are able to use the Svelte MCP server, where you have access to
comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the
available tools effectively:

1. **list-sections** - use this FIRST to discover all available
   documentation sections. Returns a structured list with titles,
   use_cases, and paths. When asked about Svelte or SvelteKit topics,
   ALWAYS use this tool at the start of the chat to find relevant sections.
2. **get-documentation** - retrieves full documentation content for
   specific sections. Accepts single or multiple sections. After calling
   list-sections, you MUST analyze the returned documentation sections
   (especially the use_cases field) and then use get-documentation to fetch
   ALL documentation sections that are relevant for the user's task.
3. **svelte-autofixer** - analyzes Svelte code and returns issues and
   suggestions. You MUST use this tool whenever writing Svelte code before
   sending it to the user. Keep calling it until no issues or suggestions
   are returned.
4. **playground-link** - generates a Svelte Playground link with the
   provided code. After completing the code, ask the user if they want a
   playground link. Only call this tool after user confirmation and NEVER
   if code was written to files in their project.
