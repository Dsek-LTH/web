# CLAUDE.md

@../AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `../DESIGN.md` before making architectural decisions here.** It records the rewrite's design decisions and open questions (auth strategy, API shape, what's deliberately deferred vs. why) — several sections of this file describe a first-pass implementation that `DESIGN.md` has already superseded (notably: no-auth-yet and the SvelteKit-side response reshaping). Don't treat this file's description of the current code as the target shape without checking there first.

## Status

This Go module is becoming the backend for the [Dsek-LTH/web](https://github.com/Dsek-LTH/web) site (the main SvelteKit app lives in the parent directory, one level up), replacing it piece by piece. Articles (`internal/articles`, `internal/api/huma_articles.go`) was the first ported feature, and **the SvelteKit app actually calls this API now** for it (see "Consumed by SvelteKit" below) — this isn't just a parallel implementation, it's load-bearing. Events (`internal/events`, `internal/api/huma_events.go`) is the second — ported server-side (CRUD, recurring series, going/interested, comments, tags) per `DESIGN.md`'s "Events" section, and **the SvelteKit frontend calls it now too**, for the subset that has a real backing endpoint (list/detail/create/edit/delete/going-interested/comments) - see "Events routes" below for exactly which routes still stay on Prisma and why. Shop/tickets/bookings and everything else in the SvelteKit backend still live only in `../src`, with shop/tickets specifically decided to never be ported at all (see `DESIGN.md`'s "Shop / tickets: cut from scope entirely"). Data access is pgx + sqlc (see below); HTTP routing is the stdlib `net/http` `ServeMux` (see API section); DB migrations go through `golang-migrate` (see "Database migrations" below) — all were open questions when this file was first written and are now settled precedents for whatever gets ported next.

Runs on **`:8090`**, not `:8080` — the SvelteKit app's `scheduler-service` already claims `:8080` in local dev (`SCHEDULER_ENDPOINT` in `../.env`). See `main.go`.

## Commands

- Build: `go build ./...`
- Run: `go run .`
- Dev (hot reload): `make dev` (runs `go tool air`; no `.air.toml` yet, uses air's defaults, output in `./tmp` which is gitignored)
- Format: `make format` (runs `goimports` then `golines` w/ `gofumpt` as the base formatter — don't use plain `gofmt`, this is the project's real formatting step)
- Regenerate DB code after editing `internal/db/schema.sql` or `internal/db/queries/*.sql`: `make generate` (runs `go tool sqlc generate`, config in `sqlc.yaml`)
- Apply/inspect DB migrations: `go tool migrate up` / `go tool migrate down [n]` / `go tool migrate force <version>` / `go tool migrate version` — see "Database migrations" below. Run from `backend/` like everything else here.
- Vet: `go vet ./...`
- Test (once tests exist): `go test ./...`; a single test: `go test ./... -run TestName`

Module path: `github.com/dsek-lth/web/backend`, Go 1.26.0.

`air`, `golines`, `goimports`, `gofumpt`, `sqlc`, and `cmd/migrate` (this module's own minimal migration CLI, see below — not the stock `golang-migrate/migrate/v4/cmd/migrate`) are declared as `tool` dependencies in `go.mod` (Go 1.24+ tool directive) and invoked via `go tool <name>` — not installed globally. `golines --base-formatter` is passed the string `"go tool gofumpt"` rather than the bare `gofumpt` binary name, since `gofumpt` isn't on `$PATH`; keep that in mind if the Makefile is ever touched.

## Database

Data access is **pgx + sqlc**, chosen to replace `../src/database/schema.zmodel` (ZenStack/Prisma). Not an ORM: `internal/db/schema.sql` declares table shapes, `internal/db/queries/*.sql` holds hand-written SQL, and `sqlc generate` emits typed Go (`Queries` struct, param/result structs) into `internal/db/*.go`. Treat every non-`schema.sql`/`queries/` file in `internal/db/` as generated — don't hand-edit it, edit the SQL and regenerate.

**This backend connects to the same live Postgres database the SvelteKit app uses** (`POSTGRES_URL`), not a fresh one it owns migrations for. `internal/db/schema.sql` is a *description* of tables that already exist — it is never run as a migration. Consequently:

- Prisma/ZenStack (`../src/database/`) remains the source of truth for the actual DB schema and migrations for now. If a table changes there, `internal/db/schema.sql` has to be updated by hand to match — nothing keeps them in sync automatically.
- Only the tables articles need were ported so far (articles, authors, members, committees, positions, mandates, phadder_groups, custom_authors, custom_author_roles, tags, article_comments, article_requests, plus the two implicit join tables `_article_tags`/`_article_likes`). Extend `schema.sql` with more tables as more features get ported — don't feel obligated to port everything at once.
- `schema.sql` was written by cross-checking `\d <table>` against the live dev DB, not just transcribed from `schema.prisma` — several columns actually differ from what the Prisma file implies (e.g. `mandates."phadderInId"` and `phadder_groups."createdAt"` are camelCase with no snake_case mapping; `authors.type` is a generated/stored column). If a discrepancy shows up again, trust `psql \d`, not `schema.prisma`.
- **Column order in `schema.sql` must match the live table.** sqlc resolves `SELECT *` / `RETURNING *` positionally against the schema — if `schema.sql`'s column order drifts from the real table, generated code silently scans values into the wrong struct fields. The queries in `internal/db/queries/` avoid this by never using `*`; keep doing that in new queries rather than re-verifying column order every time.
- Prisma connection strings carry a `?schema=public` query param that pgx doesn't understand (rejected as an unrecognized server parameter). `internal/db/pool.go`'s `NewPool` rewrites it to the real Postgres GUC, `search_path`, before connecting — this is why `POSTGRES_URL` from the root `.env` works unmodified.
- `main.go` loads `backend/.env` if present, else falls back to `../.env` (the SvelteKit app's env file) — see the comment there for why `godotenv.Load` needs two separate calls rather than one call with two filenames.
- Local dev Postgres is the `dsek-db` container from `../docker-compose.yml` (`docker start dsek-db` / `docker compose up -d db` from the repo root).

### Database migrations

`internal/db/migrations/` is a real `golang-migrate` migration directory (plain versioned `.sql` files, `<timestamp>_<description>.up.sql`), applied via `go tool migrate` (`cmd/migrate/main.go` — a minimal wrapper around the `golang-migrate` library, not the stock CLI binary; see that file's doc comment for why: the stock binary selects DB/source drivers via build tags, and `go tool` has no way to pass build tags through). See `DESIGN.md`'s "DB migrations, once Prisma is gone" section for the full decision, but the practical points:

- The directory currently holds a **copy** of Prisma's entire migration history (`../src/database/prisma/migrations/*/migration.sql`, copied not moved — Prisma is still the live, active migration path for every table Go hasn't ported, so its own directory has to stay intact and operative). The two histories are expected to diverge from here: Prisma keeps gaining migrations for tables Go doesn't own, Go gains migrations only for tables it does.
- The live dev DB already has all of Prisma's migrations applied, so `migrate`'s own tracking table (`schema_migrations`, distinct from and non-conflicting with Prisma's `_prisma_migrations`) was bootstrapped via `force`, not replayed.
- **`sqlc` still reads from the hand-maintained `internal/db/schema.sql`, not from this migrations directory** — tried pointing it at `internal/db/migrations` instead (same "single source of truth" reasoning as adopting `migrate` in the first place) and reverted after testing: `sqlc` has no way to model only a subset of tables, so pointed at the full migration history it generated a Go struct for *every* table in the live DB, including the shop/ticket/order/payment tables this project has decided not to model in Go at all (see `DESIGN.md`'s "Shop / tickets: cut from scope entirely"). `schema.sql`'s existing hand-sync-against-`psql \d` workflow (see below) is unchanged by any of this.
- New migrations for tables Go owns should include a real `.down.sql` alongside the `.up.sql` — the migrations copied from Prisma don't have one (Prisma never generated down migrations), but that's a property of the old history, not a pattern to continue.

## API

`internal/api` wires handlers onto `net/http`'s built-in `ServeMux` via **huma** (`github.com/danielgtaylor/huma/v2`, `humago` adapter) — code-first: handlers take/return typed Go structs and huma derives the OpenAPI spec (served at `/openapi.json`, docs at `/docs`) from those types at request-routing time, so the spec can't drift from the code. See DESIGN.md's "API shape and frontend integration" for why. `internal/articles`/`internal/events` are the domain/service layers (`Service`, wrapping `*db.Queries`); `internal/api` only does HTTP concerns (typed request/response structs, error-code mapping via `huma_errors.go`) and never touches `internal/db` directly. Every request goes through `auth.Middleware` (see below) and `locale.Middleware` before reaching a handler, plus a permissive CORS layer since the SvelteKit frontend calls this API directly from the browser (see DESIGN.md).

**huma gotcha: two domain packages cannot define same-named DTO structs.** huma's OpenAPI schema registry names a component schema after the bare Go type name, not the package-qualified one - registering routes from two packages that each define their own `Member`/`Tag`/`Comment` struct **panics at server startup** ("duplicate name"), not at `go build`/`go vet` time. `internal/apitypes` holds the shared shapes (`Member`, `Tag`, `Comment` - identical across articles/events since they describe the same `members`/`tags` tables); each domain package references them via a type alias (`type Member = apitypes.Member`), not its own struct, so existing call sites don't change and huma sees one shared type. Check any new domain package's exported DTO names against every other registered package before assuming `go build` passing means the server will actually start.

### Articles routes

Routes (all under no path prefix — `main.go` mounts the router at `/`; registered in `huma_articles.go` and `huma_directory.go`):

- `GET /articles` — list, query params `search`, repeated `tags` (tag UUIDs, ANY-match), `committeeId`, `authorStudentId`, `page` (1-based), `pageSize`. Always published+non-removed only — there's no unfiltered list endpoint, only the single-article one below.
- `GET /articles/{slug}` — detail, published+non-removed only (404 otherwise), unless `?status=any` is passed, which bypasses that filter (for an author loading their own draft/scheduled article — see `Service.GetAny`).
- `POST /articles`, `PATCH /articles/{slug}` — create/update. **Update is full-replace (PUT semantics dressed as PATCH), not a partial patch** — the caller must resend every field, including `publishedAt`; omitting it un-publishes the article. This was a deliberate simplification, not an oversight — revisit only if a real partial-update caller shows up. The author's `member` is always resolved from the acting identity (see Auth below), never from the request body — there's no way to save an article under a different member's byline than whoever is authenticated.
- `PATCH /articles/{slug}/schedule` (body `{"scheduledId"}`) — targeted single-field write for the caller's external scheduler task id, set after scheduling a future publish succeeds elsewhere (this API doesn't schedule anything itself, see Mocking section). Deliberately separate from the full-replace update above.
- `DELETE /articles/{slug}` — soft-delete (`removed_at`), row is not removed
- `POST /articles/{slug}/likes`, `DELETE /articles/{slug}/likes` — as the acting identity, no memberId in the request
- `POST /articles/{slug}/comments` (body `{"content"}`), `DELETE /articles/{slug}/comments/{commentId}` — as the acting identity
- `GET /tags`
- `POST /uploads` (multipart, field `file`) — see Mocking section; storage is mocked, returns a placeholder URL
- `GET /committees` (optional `?shortName=`), `GET /members/{id}/mandates` (currently-active only), `GET /custom-authors` (unfiltered — see doc comment on `ListCustomAuthors` query) — small "directory" endpoints added to support the article author-picker and committee-news page, not a first step toward porting those domains in full.

Ported from the SvelteKit backend (`src/lib/news/*`, `src/routes/(app)/news/*`): listing with search/tag/committee/author filters/pagination, publish-window + soft-delete filtering, slug generation (`internal/slug` — byte-for-byte port of `src/lib/utils/slugify.ts`, shared with events, tested against its test cases in `internal/slug/slug_test.go`), author resolution (member / mandate / custom-author, reused via `FindAuthor`-or-`CreateAuthor` like the original), tags, comments, likes, and HTML sanitization of `bodySv`/`bodyEn` (via `bluemonday.UGCPolicy()`, replacing `isomorphic-dompurify`).

**Still genuinely not ported** (no interface exists because nothing depends on it yet):
- **The article moderation/request workflow** (`article_requests` table, `ArticleRequest` in Prisma) — schema exists (ported as an articles dependency), no endpoints.
- The nollning-specific tag-prefix filtering in `BASIC_ARTICLE_FILTER` (`NOLLNING_TAG_PREFIX`) — not replicated since the nollning feature isn't ported. SvelteKit's tag *listing* (as opposed to article listing) still goes through Prisma for this reason - see below.

### Events routes

Registered in `huma_events.go`. See `DESIGN.md`'s "Events" section for the full rationale behind every divergence noted below - this is just the route list.

- `GET /events` — list, query params `search`, repeated `tags` (tag UUIDs, ANY-match), `past` (bool — upcoming by default, ended events if true), `page` (1-based), `pageSize`. Visibility: non-removed only, same as articles' publish/removed filtering.
- `GET /events/{slug}` — detail, non-removed only (404 otherwise) unless `?status=any` (same bypass convention as articles, for an editor viewing a soft-removed event — see `Service.GetAny`).
- `POST /events` — create. Body is `events.EventInput`; set `recurring` (`{type, separationCount, endAt}`) to create a whole weekly/monthly/etc. series instead of a single event — every occurrence is materialized as its own row up front, not expanded at read time.
- `PATCH /events/{slug}` (query `?scope=THIS|FUTURE|ALL`, default `THIS`) — full-replace update, same PUT-dressed-as-PATCH convention as articles. `FUTURE`/`ALL` apply the new content to every affected sibling in a recurring series but preserve each occurrence's own date, only shifting the submitted start/end time-of-day (`Service.retimeOccurrence`). Unlike articles, **the acting identity never replaces `author_id`** on update — see DESIGN.md for why events deliberately diverges from articles' "always re-attribute to the editor" rule here.
- `DELETE /events/{slug}` (query `?scope=THIS|FUTURE|ALL`, default `THIS`) — soft-delete (`removed_at`); `FUTURE`/`ALL` soft-delete every affected sibling. No "own event" bypass, unlike update — only `apinames.EventDelete`.
- `PATCH /events/{slug}/attendance` (body `{"status": "going"|"interested"|"none"}`) — sets the acting member's RSVP; going/interested are enforced mutually exclusive in code (the only write path to either join table), not left to caller convention.
- `POST /events/{slug}/comments` (body `{"content"}`), `DELETE /events/{slug}/comments/{commentId}` — as the acting identity, gated on `apinames.EventComment`/`EventCommentDelete` (the old TS comment-delete action had no auth check at all - fixed, not replicated).

**Wired into the SvelteKit frontend (2026-09-01)** for the ported subset: list, detail, create, edit, delete, going/interested, comments now call this API from `../src/lib/events`/`../src/routes/(app)/events` (same `+page.ts`/`+page.server.ts` split articles already uses). **Deliberately still on Prisma, not touched by this pass**: `all-events` (admin bypass listing), `calendar`, `tv`, `subscribe` (ICS feed), `id/[id]` (legacy slug-backfill redirect), and the nollning events page - none of their backing Go endpoints exist yet (see "not ported this pass" below), so converting them would mean either building new Go endpoints or leaving them broken; both out of scope for a frontend-wiring pass. `src/lib/events/getEvents.ts` (`getAllEvents`/`getEvent`, Prisma-backed) still exists and is still correct to use for exactly those deferred routes - don't delete it. Two known gaps from this pass, both accepted because nothing currently renders the pages that would need them (`/events`, `/events/[slug]`, `/events/all-events`, `/events/calendar` are `<NotImplemented />` stubs; `create`/`[slug]/edit` have no `+page.svelte` at all, only server logic - this predates the port, not introduced by it):
- Push notifications to an event's organizer on going/interested aren't ported (see below) and aren't replicated client-side either.
- The edit page can't prefill a recurring series' own settings (type/separationCount/end date) - Go's `EventDetail` only exposes `recurringParentId`, not the `RecurringEvent` row itself; `GetRecurringEvent` exists as a query (`internal/db/queries/events.sql`) but isn't wired to any route yet.

Not ported this pass (see DESIGN.md for the full "Events" section): push notifications on going/interested, the calendar range endpoint, the ICS subscribe feed, the typeahead search endpoint, the admin all-events bypass listing, nollning event visibility.

## Auth, scheduling, notifications, uploads: mocked, not absent

Every request is authenticated as a fixed dev identity with every policy (`internal/auth`, `MockAuthenticator`); see DESIGN.md's Auth section for the real design (`Identity`, `auth.Require`, policy names in `internal/apinames`) and why this is a deliberate stand-in, not deferred work. **Scheduling, push notifications, the Discord webhook, and image storage are similarly mocked, not absent** (for articles - events doesn't use any of these yet, see "Not ported this pass" above) — `internal/integrations` defines real interfaces (`Scheduler`, `Notifier`, `Webhooker`, `Uploader`) called from the real call sites in `articles.Service`, backed only by `Mock*` implementations that log and no-op/return placeholders. See DESIGN.md's "Mocking out-of-scope dependencies" section for the pattern and why nothing about this lives in SvelteKit anymore.

## Consumed by SvelteKit

This section describes the article integration specifically. Events follows the same integration pattern (`+page.ts`/`+page.server.ts`, `$lib/api/client`) for its ported subset — see "Events routes" above for exactly which routes and what's still deliberately left on Prisma.

`../src/lib/api/schema.d.ts` (generated by `openapi-typescript` from this API's own `/openapi.json`) and `../src/lib/api/client.ts` (a thin `openapi-fetch` client, `PUBLIC_GO_BACKEND_URL` from `../.env`) are the only integration surface — **no hand-written client or DTOs** (the earlier `src/lib/server/goApi.ts` and `src/lib/news/getArticles.ts` mapping layer are deleted). Every article component and route imports `components["schemas"][...]` from `schema.d.ts` directly and calls `api.GET/POST/PATCH/DELETE(...)` from `client.ts` at the call site — see DESIGN.md's "API shape and frontend integration" section. `client.ts` lives outside `$lib/server` because SvelteKit's universal `+page.ts` loads call this API directly from the browser as well as the server, per that same section's "every article page moves to `+page.ts`" decision.

Things to know if you're touching either side of this boundary:

- **Locale.** Every translated field ships *both* the raw pair (`headerSv`/`headerEn`) *and* one resolved field (`header`), chosen server-side (`internal/locale`) from the `Accept-Language` header, replicating the old Prisma `translationExtension`'s fallback rule. `client.ts` sets that header from paraglide's `getLocale()` on every request. Display code reads the resolved field; edit forms read the raw pair. Nothing on the frontend computes a resolved value itself.
- **List items don't carry full comments**, only `commentCount` — `ArticleSummary` vs `ArticleDetail` (`ArticleSummary` + `comments`) in the generated schema, unlike the old Prisma version where both queries happened to share one `include` and so had the same shape.
- **Likes/comments are wired up on both sides but unused by the web frontend** — no like button or comment UI exists in `src/routes/(app)/news/` today (confirmed by searching for consumers before assuming otherwise). `Author.type`/full likers list therefore stay minimal here (a `likeCount`, not a per-viewer "liked" boolean or full list) — revisit if a real like button ships.
- **The article feature's own pages use this API's `GET /tags` exclusively**, not `src/lib/news/tags.ts` (the Prisma version that excludes nollning-prefixed tags) - nollning tags show up in the news filter/author-picker forms as a result, which is an accepted trade (see DESIGN.md's mocking principle), not an oversight. `src/lib/news/tags.ts` itself still exists and is still correct to use for the non-article features that share it (Events, member settings) - it just isn't called from anywhere under `src/routes/(app)/news/` anymore.
- **Editing always re-attributes the article to whoever saves the edit** (see the create/update bullet above) — the edit page's author picker is built from the *editor's* own mandates/custom-authors, not the original author's; see DESIGN.md's implementation notes for the full reasoning.

## Repo context

This directory is a subdirectory of the larger `Dsek-LTH/web` git repository (branch `go-backend`), not its own git repo. The repository root (one level up) is a SvelteKit/TypeScript/Prisma/ZenStack project — see `../README.md` and `../AGENTS.md` for that project's context. Do not assume this Go backend shares any of that project's tooling (pnpm, ESLint, Prettier, etc.); it is built and run independently. `go build` output binaries (e.g. `./backend`) are gitignored — don't commit them.
