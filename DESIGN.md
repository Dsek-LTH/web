# Web Rewrite — Design Document

This records the design decisions and tradeoffs behind the migration of
[Dsek-LTH/web](https://github.com/Dsek-LTH/web)'s backend from
SvelteKit+Prisma/ZenStack to the Go backend in `backend/`. It exists so
future work (by anyone, human or agent) stays consistent with decisions
already made instead of re-litigating them or accidentally reversing them.

**This is a living document.** Update it when a decision changes — don't let
it drift into a stale historical record. When a decision here is
superseded, say so explicitly rather than silently deleting the old one;
the reasoning for why something changed is often as useful as the decision
itself.

## Scope of the rewrite

The Go backend is a **full replacement**, not a permanent companion
service. The end state has no Prisma, no ZenStack, and no auth-handling
code on the SvelteKit side — SvelteKit becomes a pure frontend (SSR +
browser client) talking to the Go API for everything. Design decisions
should optimize for that end state, not for smooth long-term coexistence
between two backends.

The site is being treated as **non-production for the entire duration of
the rewrite** — no real users depend on it right now. This relaxes
constraints that would normally apply to a production migration: no need
to dual-write, no need to preserve legacy session/auth compatibility
mid-migration, no need for a zero-downtime cutover. This is what licenses
mocking missing dependencies (starting with auth, see below) instead of
deferring real work until they exist.

## Shop / tickets: cut from scope entirely (decided 2026-09-01, SvelteKit-side removal implemented 2026-09-01)

**Status: decided and implemented on the SvelteKit side** (the Go-side non-porting was already true by construction - there was never anything to remove there). The shop/ticket/payment domain (Prisma models
`Shoppable`, `Ticket`, `Consumable`, `ConsumableReservation`,
`ShoppableAccessPolicy`, `Order`, `OrderItem`, `Payment` —
`src/lib/server/shop/`, `src/lib/utils/shop/`, `src/routes/(app)/shop`,
`src/routes/(app)/shop/tickets`, `src/routes/(app)/events/[slug]/scan/[consumable]`,
`src/routes/(nollning)/nollning/shop`) is **not being ported to Go, and is
not being mocked either** — it is being removed from the product. This is
a different treatment than every other out-of-scope dependency in this
doc: mocking (see "Mocking out-of-scope dependencies" below) exists to
preserve a real call shape for something that will come back later; this
is a decision that the feature itself doesn't come back.

Concretely:

- **Go never gains a shop/ticket/order/payment schema or endpoints.**
  These tables stay out of `internal/db/schema.sql` entirely — nothing
  ports them, not even as an articles/events-style dependency.
- **Events port without tickets.** The `Event` → `Ticket` relation and
  everything downstream of it (ticket purchase, ticket scanning/check-in
  at `events/[slug]/scan`, `Order`/`Payment`) is dropped, not mocked —
  there's no `TicketService` interface with a no-op implementation the
  way `Scheduler`/`Notifier` got one for articles. Events keep `going`/
  `interested` (RSVP, no purchase involved) since that's a plain
  Member↔Event relation with nothing shop-related in it.
- **SvelteKit-side removal is immediate and complete, not deferred - done.**
  `src/lib/server/shop/`, `src/lib/utils/shop/`, `src/lib/utils/payments/`,
  the `/shop` and `/shop/tickets` routes, the event scan/check-in route
  (plus `/admin/qr`, whose sole purpose was linking to it), the Stripe
  webhook route, the nollning shop route, and `src/lib/hooks/useQRScanner.ts`
  (its only caller was the deleted scan route) are deleted, along with
  their nav links (`routes.ts`, `postReveal/types.ts`'s
  `OVERRIDEN_POST_REVEAL_ROUTES`), the `WEBSHOP` policy block in
  `apiNames.ts`, the dead purchase/payment `NotificationType`/
  `NotificationSettingType` members and the "Purchases" settings toggle,
  the root layout's `@stripe/stripe-js` import and `shopItemCounts`/
  `depends("cart")`, and the `stripe`/`@stripe/stripe-js`/`svelte-stripe`/
  `@zxing/library` dependencies from `package.json`. Verified via
  `svelte-check` (0 errors) and `eslint` (0 errors) after removal - nothing
  left dangling. Same standard as the rest of this doc: confirmed dead (no
  remaining importers, checked file-by-file) before deleting, not left in
  place "in case something still imports them," don't leave a Prisma-backed
  path alive for a feature that isn't coming back.
  - The nollning events page (`src/routes/(nollning)/nollning/events/+page.server.ts`)
    used a ticket-joined event query (`getEventsWithTickets`) for its
    weekly schedule view; replaced with a plain `prisma.event.findMany`
    over the same date range, dropping ticket enrichment. Safe because the
    page's own `+page.svelte` is already a `<NotImplemented />` stub (this
    load function's output has no current consumer) - not a design
    decision to revisit later so much as "keep the load function from
    erroring."
  - `src/database/prisma/schema.prisma`'s `Shoppable`/`Ticket`/`Order`/
    `OrderItem`/`Payment`/`Consumable`/`ConsumableReservation`/
    `ShoppableAccessPolicy` model definitions are deliberately **not**
    touched by this pass, consistent with the "keep the underlying
    Postgres tables in place for now" decision below - removing them from
    `schema.prisma` risks Prisma treating it as a migration wanting to
    drop those tables, which is exactly what hasn't been decided yet.
- **Decided 2026-09-01: the underlying Postgres tables** (`shoppables`,
  `tickets`, `orders`, `order_items`, `payments`, `consumables`,
  `consumable_reservations`, `shoppable_access_policies`) **stay in place
  for now, unused** - not dropped via a migration. Dropping tables in the
  shared live database is a more consequential, harder-to-reverse step
  than deleting application code, so it's being treated as a separate
  decision to make explicitly
  later rather than bundled into this one.

## DB migrations, once Prisma is gone (decided 2026-09-01)

**Status: decided, not yet implemented.** Today `internal/db/schema.sql` is
a hand-maintained *description* of tables Prisma actually owns and
migrates (see "Database" in `backend/CLAUDE.md`) — kept in sync against
`psql \d` by hand, which is exactly the drift risk that file's own doc
comments warn about. That's fine only as long as Prisma is still the real
migration authority. It stops being fine once a table Go owns needs a
schema change and Prisma is deleted (per "Scope of the rewrite" above,
Prisma has no place in the end state) — Go needs a real migration story
before that happens, not after.

- **Tool: [`golang-migrate/migrate`](https://github.com/golang-migrate/migrate)**,
  added as a `go tool` dependency (`go.mod`'s `tool (...)` block) alongside
  `air`/`sqlc`/`golines`/`goimports`/`gofumpt`, invoked via
  `go tool migrate` — same pattern as every other tool in this repo, not a
  globally-installed binary. Plain versioned `.sql` files, tracked via a
  `schema_migrations` table `migrate` manages itself in Postgres.
- **Prisma's existing migration history is carried forward as a baseline
  snapshot, not discarded — but copied, not moved.** Prisma's migrations
  (`src/database/prisma/migrations/<timestamp>_<description>/migration.sql`,
  68 of them going back to `0_init`) are already exactly what
  `golang-migrate` wants: plain SQL, one file per change, already
  chronologically ordered by timestamp. Each
  `<timestamp>_<description>/migration.sql` is copied to
  `<timestamp>_<description>.up.sql` in `backend/internal/db/migrations/`
  (same repo — `backend/` is a subdirectory of this same git repo, not a
  separate one). **Copy, deliberately not `git mv`**: Prisma is still the
  live, active migration path for every table Go hasn't ported yet (its
  migrations directory has entries as recent as this year), so removing
  its history out from under it would break `prisma migrate dev` for
  everything not yet ported. Prisma's own directory stays fully intact and
  operative until the real end-state cutover (Prisma deleted entirely,
  per "Scope of the rewrite"); Go's copy is an independent starting point,
  not a replacement of Prisma's copy. The two histories are expected to
  diverge from this point forward — Prisma keeps gaining migrations for
  tables Go doesn't own yet, Go gains migrations only for tables it does —
  and that's fine; when a table currently on the Prisma side gets ported
  later, that port is what reconciles Go's schema with whatever Prisma did
  to it in the meantime (same as today's manual `schema.sql` catch-up, just
  via a real migration instead of hand-editing a description file).
  - None of the carried-forward files get a matching `.down.sql` — Prisma
    never generated down migrations, so there's nothing to carry forward
    on that side. This is a property of the old history, not a new
    limitation being introduced; **new, Go-authored migrations going
    forward should include real down files**, breaking from that old habit
    rather than perpetuating it.
  - Since the live dev DB already has all 68 Prisma migrations applied,
    `migrate`'s tracking table is **bootstrapped to the latest version
    directly (`migrate force <version>`), not replayed from scratch**.
    Prisma's own tracking table (`_prisma_migrations`) is left in place,
    inert, once Prisma itself is gone — dropping it is a low-stakes
    follow-up, not part of this change.
  - Emergent benefit, not just history preservation: because the actual
    bootstrap SQL (`0_init` onward) now lives in `migrate`'s directory
    verbatim, **a brand-new Postgres instance can be created from nothing
    but `migrate up`** — today that only works via `prisma migrate
    deploy`. That capability transfers without Prisma in the loop.
- **`internal/db/schema.sql` stays hand-maintained — tried pointing `sqlc`
  at the migrations directory instead, reverted after actually testing
  it.** The theory was the same "structurally can't drift" argument as
  above: point `sqlc.yaml`'s `sql[0].schema` at `internal/db/migrations`
  and let the migration files be the one schema source for both the live
  DB and codegen. In practice, `sqlc` has no notion of "model only these
  tables" — it generates a Go struct for *every* table visible in whatever
  it's given as schema, with no way to scope that down. Pointed at the
  full migration history, that's every table in the entire live database:
  `models.go` grew by ~800 lines, including `Order`, `Payment`, `Shoppable`,
  `Ticket`, `Consumable` (the exact tables "Shop / tickets: cut from scope
  entirely" above just decided never to model in Go) plus bookings,
  elections, cafe shifts, drink inventory, and everything else no Go code
  touches. That's a straightforward regression against both this doc's
  shop/tickets decision and `backend/CLAUDE.md`'s existing "extend
  `schema.sql` incrementally as more tables get ported" pattern — reverted,
  `sqlc.yaml` still points at `schema.sql`. The drift risk that motivated
  trying this is unchanged from before: `schema.sql` remains a hand-curated
  subset, manually kept in sync against reality. What *did* land from this
  section (the `migrate` tool itself, the converted migration files) is
  still worth having independent of this — it's the real migration story
  regardless of what sqlc reads from.
- **Not yet decided:** whether/when to drop the shop/ticket/order/payment
  tables from the live DB (see "Shop / tickets: cut from scope entirely"
  above) — deliberately left open there, unaffected by this decision.
  Once it is decided, it becomes a normal `migrate`-authored migration
  like any other schema change from that point forward.

## Architecture decided so far

- **Go module**: `backend/`, Go 1.26, layout is `internal/db` (data access),
  `internal/articles` (domain/service layer), `internal/api` (HTTP).
- **Data access**: pgx + sqlc, not an ORM. `internal/db/schema.sql` mirrors
  the live Postgres schema — verified against `psql \d` on the real dev DB,
  not transcribed from `schema.prisma`, which has been observed to disagree
  with reality in places (e.g. camelCase columns with no snake_case
  mapping). Queries never use `SELECT *`/`RETURNING *`, because sqlc
  resolves those positionally against `schema.sql`'s column order, and a
  drift there would silently scramble struct fields.
- **HTTP**: stdlib `net/http`'s `ServeMux` (Go 1.22+ method+wildcard
  routing, e.g. `"GET /articles/{slug}"`). No third-party router adopted —
  revisit only if routing needs outgrow what the stdlib mux offers.
- **Tooling**: `air` (reload), `golines`+`gofumpt` (format), `sqlc`
  (codegen) — declared as Go 1.24 `tool` dependencies in `go.mod`, invoked
  via `go tool <name>`, not installed globally.
- **Port**: `:8090`, not `:8080` — the SvelteKit app's `scheduler-service`
  already claims `:8080` in local dev.

## Auth

**Status: decided and implemented 2026-09-01** for articles
(`backend/internal/auth`, `backend/internal/apinames`). Supersedes the "no
auth yet, SvelteKit is the auth boundary" framing the first article API
pass was built under.

Because the site is non-production for the duration of the rewrite, there
is no need to keep the old Keycloak/session-based SvelteKit auth "in the
loop" while Go's auth is unbuilt, and no need to design Go endpoints around
being called by a trusted SvelteKit server. Instead: build the auth *shape*
in Go now, and mock the *implementation* until real auth is ready.

Concretely:

- Go gets a real authentication/authorization layer: middleware that
  resolves each request to an `Identity` (member id, roles/policies —
  probably mirroring the old `apiNames.*` policy-string model, e.g.
  `"news:article:create"|"news:article:like"`) and puts it in request
  context. Handlers call an `authorize(ctx, policy)`-equivalent to check
  permissions, and read "who is making this request" from context — **not**
  from a `memberId` passed in the request body, which is what the current
  article endpoints do. That pattern is a stopgap to fix, not the design to
  keep building on.
- For now, the identity resolver is **mocked**: every request is treated as
  authenticated, as a fixed dev identity with full permissions. This mock
  must be:
  - Behind a small interface (e.g. `Authenticator`) so swapping in a real
    implementation (validating a Keycloak-issued JWT, or whatever session
    mechanism the finished site ends up using) is a clean swap, not a
    rewrite of every handler.
  - Loud and hard to ship by accident: gated by an explicit, unambiguous
    env var (e.g. `AUTH_MOCK=true`), never a silent default that "just
    happens" when config is missing, and logged clearly whenever active.

**Implemented for articles:** `auth.Identity{MemberID, StudentID, Policies}`,
context-based `auth.Require(ctx, policy)`, `auth.Middleware` wrapping the
whole router, `apinames` mirrors the TS `apiNames.NEWS.*` strings exactly.
`MockAuthenticator` resolves one real member from the DB at startup
(`AUTH_MOCK_STUDENT_ID` env var, or an arbitrary member if unset) and logs
loudly on construction. Article endpoints no longer take `memberId` in
request bodies — `Create`/`Update`/`Delete`/`Like`/`Unlike`/`AddComment`/
`RemoveComment` all derive the acting member from context, and `Update`
keeps the old "own article, or `NewsArticleUpdate`" bypass. Posting as a
mandate is verified against the DB (`GetMandateMemberID`) - a real check,
not mocked, since it's just our own data.

**Still open (unchanged by the real-auth decision below):**
- Whether the mock identity's permissions should be configurable per
  scenario (e.g. to test permission-denied paths) rather than always
  all-permissions. Not needed yet - flag if that changes.

**Real auth (OIDC + session): decided and implemented 2026-09-01.**
Supersedes the "Not yet done / open" bullet above about whether SvelteKit's
`authorize()`/`isAuthorized()` UI-gating should come out — it should, as
part of this. The real `Authenticator` is Keycloak-flavored language from
the original framing above; the actual IdP is **Authentik** (see
`hooks.server.ts`'s `@auth/sveltekit` + `@auth/core/providers/authentik`
usage) — this section uses the correct name going forward.

Go becomes the OIDC client and session authority; Auth.js is deleted
rather than bridged, matching this doc's "full replacement, not smooth
coexistence" framing above. Concretely:

- **Libraries**: `golang.org/x/oauth2` + `github.com/coreos/go-oidc/v3` for
  the OIDC handshake (discovery off `PUBLIC_AUTH_AUTHENTIK_ISSUER`, JWKS-based
  ID-token verification) using **PKCE, no client secret** — the dev
  Authentik provider is already a public client (`AUTH_AUTHENTIK_CLIENT_SECRET`
  is empty in `.env`), so Go reuses the same client id rather than needing a
  new Authentik application registered. `github.com/gorilla/securecookie`
  encrypts+signs the session into the cookie itself — no server-side session
  table, no new DB precedent, same trust model Auth.js already uses today.
- **New Go endpoints**: `GET /auth/login` (PKCE verifier+state into a
  short-lived cookie, redirect to Authentik), `GET /auth/callback` (exchange
  code, verify ID token, resolve-or-create the `Member` row, encrypt
  `{studentId, groupList, refreshToken, expiresAt}` into the session cookie),
  `GET /auth/logout` (clear cookie, redirect to Authentik's `end-session/`),
  and `GET /me` (returns resolved identity + policies + roles as JSON — this
  is what SvelteKit calls instead of doing OIDC itself).
- `internal/auth` gets a `RealAuthenticator`: decrypts the session cookie: on
  missing/expired/invalid session it resolves an **anonymous** `Identity`
  (roles `["*"]`/`["_"]`), not a 401 — public GETs must keep working
  logged-out, same as today.
- **Roles/policies port**: `getDerivedRoles` (`src/lib/utils/authorization.ts`)
  is a pure function, ports directly. Policies need `api_access_policies`
  added to `internal/db/schema.sql` (an existing live Postgres table, same
  "port the query, not the schema" treatment as `members`/`mandates` — not a
  new table Go would own) plus a query mirroring
  `hooks.server.helpers.ts`'s `getAccessPolicies` (`WHERE role IN (...) OR
  student_id = ...`). The nollning `SEE_STABEN` default-policy injection in
  that same function is **not** ported, consistent with nollning being out
  of scope elsewhere in this rewrite (see the API section below) — this is a
  known, accepted behavior gap versus the old code, not an oversight.
- **Cookie scoping**: `Domain=localhost` in dev / `Domain=.dsek.se` in prod
  so the same cookie is readable by both SvelteKit's and Go's origins (same
  registrable domain, different ports/subdomains — `SameSite=Lax` already
  covers this, no `SameSite=None` needed). `internal/api/router.go`'s
  `withCORS` changes from `Allow-Origin: *` to echoing the known frontend
  origin(s) + `Allow-Credentials: true`, which the comment there already
  flagged as the eventual trigger for revisiting it.
- **SvelteKit side**: `hooks.server.ts` loses `authHandle` (`SvelteKitAuth`)
  and the `getAccessPolicies`/`getDerivedRoles` calls in `databaseHandle`,
  replaced by one forwarded-cookie call to Go's `/me`; `lib/utils/auth.ts`'s
  `signIn()`/`signOut()` become plain redirects to Go's `/auth/login` /
  `/auth/logout`; `@auth/sveltekit` and `@auth/core` are removed entirely.
- **Authentik admin**: the dev provider's redirect-URI regex
  (`https?://localhost(:\d{1,5})?(/.*)?$`) already covers Go's new callback
  URL on `:8090` regardless of path — no dev-side Authentik change needed.
  Production will need its real domain's callback URL added explicitly
  (not covered by a wildcard regex) once one exists — not needed yet.
- **Sequencing**: even though the intent is one cutover (not a long-lived
  bridge), verify the Go-side login → callback → session round-trip against
  the real `auth.dsek.se` dev instance *before* deleting Auth.js from
  `hooks.server.ts`, so SvelteKit is never left without a working login path
  mid-change. Done - verified against the real dev instance before the
  `hooks.server.ts` cutover landed.
- **ID token signature verification, RS256 vs HS256**: discovered during
  verification, not anticipated in the original plan above. Authentik signs
  a Public client's (dev's) ID tokens with **HS256 using a client secret
  that's never exposed in the Authentik UI at all** - a real Authentik
  limitation, not a config mistake (confirmed by reading `oauth4webapi`, the
  library `@auth/sveltekit` uses: it never cryptographically verifies the ID
  token in the standard code flow at all, which is why the old code "worked"
  with an empty `AUTH_AUTHENTIK_CLIENT_SECRET`). `go-oidc`'s JWKS-based
  verifier has no way to check a symmetric signature, so `internal/auth`
  picks the verification path based on whether a client secret is
  configured: empty (dev's public client) → `provider.Verifier()`, JWKS/RS256
  the normal way; non-empty (a real deployment's confidential client) →
  `hmacKeySet` (`internal/auth/hmac_keyset.go`), a custom `oidc.KeySet` that
  verifies HS256 via `go-jose` using the secret as the HMAC key. Both paths
  are genuine cryptographic verification - never skipped - which is actually
  stronger than what Auth.js itself was doing. (Separately: the dev
  provider's discovery document briefly, incorrectly advertised HS256 too,
  from what turned out to be an Authentik-side stale-metadata bug - re-saving
  the provider in Authentik's admin UI without any actual change fixed it
  back to RS256.)
- **Set-Cookie forwarding, SvelteKit ↔ Go**: a direct browser→Go fetch (e.g.
  `+page.ts` calling the articles API) gets Go's `Set-Cookie` for free - the
  browser handles it natively. But `hooks.server.ts`'s own call to `GET /me`
  is server-to-server (SvelteKit's Node process → Go), a different origin
  the browser is never involved in, so nothing forwards cookies either
  direction automatically. `src/lib/server/goAuth.ts`'s `fetchIdentity()`
  forwards the incoming request's `Cookie` header to Go by hand, and parses
  Go's `Set-Cookie` response header(s) back into `event.cookies.set()` calls.
  Without this, a session refreshed by Go during an SSR request would never
  reach the browser, and - if Authentik rotates refresh tokens - the next
  refresh attempt would fail outright using the now-stale token still sitting
  in the browser's cookie.
- **Concurrent refresh races: fixed 2026-09-01.** `OIDCClient.Refresh`
  (`backend/internal/auth/oidc.go`) is called synchronously, per-request,
  whenever `RealAuthenticator.Authenticate` sees an expired session - there's
  no proactive/background refresh. Several requests can therefore land with
  the same expired session at once (e.g. a page load firing off a few
  parallel API calls), each independently trying to exchange the same
  refresh token. Because Authentik rotates refresh tokens, the first
  exchange to land invalidates the token for the rest, and those requests
  would see a hard refresh failure - `RealAuthenticator` treats that as
  logged-out and clears the session cookie, so this was a real spurious
  user-visible logout under nothing worse than a couple of concurrent
  requests. (The old `hooks.server.ts` code had this same failure mode in
  theory, but almost never hit it in practice as a single-request-at-a-time
  server action; it avoided it anyway via `lib/utils/auth.ts`'s
  `pendingRefreshesByToken` map.) Fixed by collapsing concurrent `Refresh`
  calls that share a refresh token into one upstream exchange via
  `golang.org/x/sync/singleflight`, keyed on the refresh token, with all
  waiters getting the same result. The shared exchange deliberately runs on
  a **detached context** (10s timeout, not any caller's `ctx`) rather than
  whichever request happens to be the "leader" - `singleflight.Do` runs the
  function once on behalf of every waiter, so using a caller's own `ctx`
  would mean that caller's browser tab closing mid-refresh cancels the
  refresh for every other concurrent request too, reintroducing the same
  spurious-logout failure just relocated to leader-cancellation instead of
  the token race. Each caller still respects its own `ctx` when waiting on
  the shared result, so a slow/cancelled caller doesn't block, but doesn't
  disrupt the shared work for the others either.
- **Known gap: new members no longer get default tag subscriptions /
  notification settings on first login.** `src/lib/utils/member.ts`'s
  `createMember()` (subscription_settings + default/nollning tag
  subscriptions) was, before this change, only ever called from
  `hooks.server.ts` on first login. Go's `/auth/callback` now
  resolves-or-creates the `Member` row *before* that SvelteKit code ever
  runs (see the minimal `CreateMember` query's own doc comment in
  `internal/db/queries/members.sql`), so by the time `hooks.server.ts` looks
  the member up, the row already exists and the fuller TS `createMember()`
  never fires. Accepted rather than fixed now, the same way nollning gaps
  elsewhere in this rewrite are accepted: `subscription_settings` and the
  tag-subscription join table aren't modeled in Go at all yet. Revisit if/
  when those get ported - `hooks.server.ts`'s `createMember()` call is kept
  in place as a fallback (reachable if e.g. `AUTH_MOCK` bypasses Go's own
  member creation), so nothing needs to change there when this gets fixed,
  only Go's side.

## API shape and frontend integration

**Status: decided 2026-09-01, implemented 2026-09-01.** `src/lib/server/goApi.ts`
and `src/lib/news/getArticles.ts` (the hand-written client and mapping layer
built under the earlier "bridge two coexisting backends" framing) are
deleted. Every article-related component and route now reads the generated
types (`src/lib/api/schema.d.ts`, `src/lib/api/client.ts`) directly.

Decisions (the second round, made after seeing the first pass's gaps -
notably leftover Prisma calls in already-"ported" pages, which turned out
to be an oversight, not a considered choice):

- **The Go API is the source of truth for types.** No hand-written
  TypeScript interfaces re-describing what Go already returns, and no
  hand-written fetch client. An OpenAPI spec is generated from the Go
  handlers themselves (not a hand-maintained spec, and not comments that
  could drift from the code), and the TypeScript types + client are
  generated from that spec.
  - **Go side: [huma](https://huma.rocks)**, code-first. Handlers take/return
    typed Go structs; huma derives the OpenAPI spec from those types at
    request-routing time, so the spec cannot drift from the code the way
    annotation-comment-based tools (swaggo) can. This replaces the current
    hand-decoded/encoded `net/http` handlers in `internal/api`.
  - **TypeScript side: `openapi-typescript` + `openapi-fetch`.** The former
    generates types only (no runtime code) from the spec; the latter is a
    thin typed wrapper around native `fetch` from the same maintainers.
    Chosen over heavier generated-client-class tools (openapi-typescript-codegen,
    orval) as the minimal option with the least generated surface to reason
    about.
  - **Sequencing:** prove the whole pipeline (huma handler → generated spec
    → generated TS types/client → a working typed call against the live
    dev DB) on a single endpoint first, before migrating the rest. This is
    a real restructuring of every handler; a pipeline-level surprise should
    surface on one endpoint, not after all of them are rewritten.
  - **Fetching convention:** call the generated client directly at each
    call site (e.g. `client.GET("/articles/{slug}", ...)`) rather than
    wrapping every endpoint in a bespoke named function. The generated
    client is already fully typed (path, params, response); a wrapper
    layer would be indirection around something already ergonomic. Only
    extract a named helper if the exact same call is genuinely duplicated
    across several call sites — after the fact, not planned up front.
- **Locale resolution moves into Go, additively.** Every translated field
  in a response includes *both* the raw pair (`headerSv`/`headerEn`) *and*
  one resolved field (`header`, chosen via `Accept-Language`/similar,
  replicating the old Prisma `translationExtension`'s fallback rule).
  Display components read the resolved field; edit forms read the raw
  pair. Nothing in the frontend computes a resolved value itself anymore -
  no `localized()`/`pick()` equivalent should exist there once this lands.
- **Every article page moves to `+page.ts`+`+page.server.ts` (actions
  only) — no exceptions, including create/edit.** `+page.ts` (universal
  load) runs server-side for the initial SSR request and directly in the
  browser on subsequent navigation, via the generated client. Since
  `+page.ts` runs in the browser, **it cannot use Prisma at all** - this
  forces every remaining Prisma call out of these pages' `load` functions
  (see "leftover Prisma," below). `+page.server.ts` stays only for
  `actions` (SvelteKit requires that), which call the generated client
  too, not Prisma.
  - SvelteKit's own pre-existing Keycloak/Prisma-based `authorize()`/
    `isAuthorized()` UI-gating on these pages (create/edit/delete
    visibility) is removed, not ported - it can't run in `+page.ts` either,
    and porting it to Go for real is out of scope right now. Go's
    `auth.Require` is the only gate on these routes going forward, and it's
    still the all-permissions mock from the Auth section above. The
    frontend shape should look like the finished design even though the
    backend enforcement behind it is still a stand-in.
    **Superseded 2026-09-01 by "Real auth" below, which was never
    circled back to fix this bullet's downstream effects** - see the
    `canEdit`/`canDelete` correction further down and "Known gap:
    frontend authorization must not be reimplemented, anywhere" in
    "Principles going forward" for the accurate current state and the
    open fix.
- **Leftover Prisma calls in already-"ported" article pages are being
  removed, not kept.** These existed because porting them fully would have
  meant expanding Go's scope beyond articles - that reasoning turned out to
  be wrong: partial functionality with the real shape beats full
  functionality achieved by quietly keeping an old code path alive.
  Resolved per-case:
  - `scheduledArticles` (news list page, "my future-scheduled articles"):
    no Go query shape for this yet - dropped for now, can come back once
    something needs it for real.
  - Committee lookup by shortName (committee-news page, article committee
    display): **new minimal Go endpoint** (`GET /committees`, see below) -
    small, contained, and `committees` is already in `schema.sql`.
  - Tag listing for the filter dropdown/author-picker forms (previously
    stayed on Prisma to exclude nollning-prefixed tags): switched fully to
    the Go API's `GET /tags`, called straight from `+page.ts` like
    everything else on these pages - no Prisma involved at all anymore,
    not even behind an internal endpoint. Nollning tags now appear in
    these lists - the correct trade per the mocking principle: the
    consequence of not excluding them is "some extra tags show up," not
    "a component can't render," so there's no reason to keep a
    Prisma-backed detour just to avoid it. Revisit only if that changes.
  - Author "post as" options (the current member's mandates and custom
    authors they manage, on create/edit): **new minimal Go endpoints** -
    both tables are already in `schema.sql` as articles dependencies.
  - Comment `@mention` resolution (`getAllTaggedMembers`, article detail
    page): stays on Prisma for now - it's a lookup-any-members-by-studentId
    utility shared with Events (not an article-specific concern), and
    nothing renders comments in the UI today regardless (see "Likes/
    comments are wired up... but unused" note elsewhere in this file).
    Revisit if that changes.

**Implementation notes from the 2026-09-01 pass:**

- **No Prisma calls remain anywhere in the article feature's frontend
  code, including behind internal endpoints.** An earlier version of this
  pass added a small `+server.ts` (`GET /api/news/tags`) so `+page.ts`
  could reach the nollning-excluding Prisma tag query, on the theory that
  `+page.ts` "can't reach Prisma-only data directly" so a server-only
  detour was needed. That was the wrong call — the fix for "`+page.ts`
  can't use Prisma" is to stop needing Prisma there, not to smuggle it in
  behind an endpoint. Deleted; see the tag listing bullet above. The
  general rule going forward: if a `+page.ts` load needs data that would
  require Prisma, either serve it from a real (possibly empty/mocked) Go
  endpoint, or drop it and accept the degraded-but-honest consequence —
  never reintroduce a Prisma read path for feature code that's been
  ported, even indirectly.
- **"Post as" identity (self member, for the author picker) comes from the
  root layout's already-existing `data.member` via `parent()`**, not a new
  fetch - that session data was already flowing to every page before this
  work and isn't itself a Prisma call this feature owns.
- **Editing an article always re-attributes it to whoever saves the
  edit.** Go's `articles.Service.resolveAuthor` resolves the author's
  `member` from the acting identity unconditionally (see Auth section) -
  there's no code path left for "person B edits person A's article while
  keeping A as the byline." The edit page's author picker is therefore
  built from the *editor's* mandates/custom-authors, not the article's
  original author's, and pre-selects whichever option matches the
  article's current byline type if one exists (falling back to "post as
  yourself" otherwise) - since saving will reassign authorship to the
  editor regardless of which option looks selected. This is a real,
  intentional behavior change from the old Prisma version, not an
  oversight; revisit if an admin-edits-on-behalf-of-another-member
  workflow turns out to matter.
- **`canEdit`/`canDelete` on the article detail page are hardcoded `true`**,
  not derived from any session/policy check. An earlier version of this
  pass gated on "is anyone logged in" (`!!data.member`) as a "closest
  meaningful placeholder" - that was still solving a problem that doesn't
  exist yet: Go's `auth.Require` is the only real gate and it's the
  all-permissions mock, so *every* request is currently "authorized"
  regardless of who's browsing. Approximating a signal for a check that
  always passes anyway is pointless indirection - just say `true` and mock
  it plainly, matching the rest of the mocking principle. Revisit once Go
  exposes the acting identity's policies to the frontend for real.
  **STALE - confirmed wrong 2026-09-01, not yet fixed.** The condition
  this bullet names for revisiting ("once Go exposes the acting identity's
  policies to the frontend for real") has been true since "Real auth"
  below landed *the same day* this was written: `GET /me` returns real
  resolved `policies`, and `hooks.server.ts` already stores them on
  `locals.user.policies`, propagated to every page via the root
  `+layout.server.ts` → `parent()`. Mock auth (`AUTH_MOCK=true`) is not
  the default - `.env` has real Authentik credentials configured and
  nothing sets `AUTH_MOCK`, so `RealAuthenticator` (real per-member
  policies via `ListPoliciesForRolesOrStudentID`) is what actually runs
  unless a developer explicitly opts into the mock for local testing (as
  happened repeatedly this session, which is what created the impression
  auth was still mocked - it wasn't, that was a testing shortcut, not the
  shipped default). Nobody went back to fix this bullet once its own
  stated condition became true. The same hardcoded-`true` pattern was then
  **copied into `internal/events`'s equivalent fields** when events was
  ported, carrying the stale reasoning forward a second time without
  re-checking it.
  **Not simply "swap in `isAuthorized(apiNames.EVENT.UPDATE, user)`
  client-side," though — see "Known gap: frontend authorization must not
  be reimplemented, anywhere" in "Principles going forward" for why that
  particular fix was rejected and what the right shape is instead.**
  **FIXED 2026-09-01, same day it was flagged.** `ArticleDetail`/
  `EventDetail` now carry real `canEdit`/`canDelete` fields
  (`backend/internal/articles/types.go`, `backend/internal/events/types.go`),
  computed in each `Service.detail` from the exact author-or-policy checks
  `Update`/`Delete` already run (`identity.MemberID == article's author` OR
  the `*Update` policy, for `canEdit`; the `*Delete` policy alone, for
  `canDelete` - matching articles' and events' own `Update`/`Delete`
  bypass rules precisely, including events' no-author-bypass-on-delete
  divergence). Anonymous requests get a real (non-privileged, unless the
  `*` wildcard role grants otherwise - see below) `Identity` from
  `RealAuthenticator.anonymousIdentity`, not a missing one, so the
  zero-value `false`/`false` only applies when policy lookup genuinely
  finds nothing. All four frontend call sites
  (`src/routes/(app)/news/[slug]/+page.ts`,
  `.../news/[slug]/edit/+page.ts`, `.../events/[slug]/+page.server.ts`,
  `.../events/[slug]/edit/+page.ts`) now read `article.canEdit`/
  `event.canDelete` etc. straight off the API response instead of
  hardcoding `true` - zero authorization logic left in TypeScript, per
  Principle #5. Verified against the live dev DB: an anonymous request
  currently gets `canEdit`/`canDelete: true` for articles too, but that's
  the dev DB's own seed data (`api_access_policies` grants the `*`
  wildcard role every `news:article:*` policy - `psql`-verified, not a
  code bug) showing through correctly, not a hole in this fix.
- **Shared low-level components take local structural prop types**
  (`{name: string; color?: string}` etc.) instead of importing either
  backend's types directly - this is prop-shape typing for reusable UI,
  not the "re-defined API type" pattern that's actually ruled out
  (hand-rolled DTOs duplicating a specific endpoint's response shape).
  `AuthorCard` and `TagChip`/`TagSelector` have zero remaining Prisma
  consumers (checked, not assumed) so their types are Go-only; `AuthorCard`
  takes a single `author` prop shaped like the Go API's `Author` (flat
  `position`, not `mandate.position`). `CommitteeSymbol`/
  `CommitteePlaceholder` and `MemberAvatar`/`MemberNames` still have real
  Prisma consumers outside the article feature (`PositionCard`,
  `contact/+page.svelte`, `about/+page.svelte`,
  `committees/+layout.svelte`, and ~15 more for `MemberAvatar` -
  bookings, expenses, notifications, navbar, board, member profile, etc.)
  so those keep a **TEMPORARY, explicitly-commented** dual-shape union
  (`string | null | undefined`) - pure type widening, no conversion
  function, no `toArticle()`-style logic. This is an accepted exception,
  not a retreat from "Prisma is dead": the alternative was touching ~20
  files completely unrelated to this feature today for zero behavioral
  change, since those pages stay Prisma-backed regardless. Narrow these
  back to Go-only as each real consumer gets ported - don't let the
  comment go stale once that starts happening.

## Events (ported 2026-09-01)

**Status: decided and implemented.** `backend/internal/events` +
`backend/internal/api/huma_events.go`, following articles' precedent as
the second feature ported per this doc's "Scope of the rewrite" framing.
Routes: `GET/POST /events`, `GET/PATCH/DELETE /events/{slug}`, `PATCH
/events/{slug}/attendance` (body `{"status": "going"|"interested"|"none"}`),
`POST /events/{slug}/comments`, `DELETE /events/{slug}/comments/{commentId}`.
Ported from `src/lib/events/*` and `src/routes/(app)/events/*`: listing
with search/tag/past-vs-upcoming filters and pagination, CRUD, recurring
series (create/edit-series/delete-series), going/interested, comments, and
tags (reusing the same `tags` table articles already uses, via a second
`_event_tags` join table).

**Cut per "Shop / tickets: cut from scope entirely" above**: the `Ticket`
relation, `events/[slug]/scan` + `scan/[consumable]` routes, and the
`canScan`/`WEBSHOP.MANAGE` field on the old detail page - none of it is
modeled in Go, not even as a mocked interface, since the feature itself
isn't coming back.

**Not ported this pass** (no interface/method exists because nothing
depends on it yet - same "extend incrementally" stance as articles' still-
missing moderation workflow):
- Push notifications to an event's organizer when a member marks
  going/interested (`sendNotification` in the old
  `src/lib/events/server/interestedGoing.ts`).
- The calendar range endpoint (`/events/calendar`), the ICS subscribe feed
  (`/events/subscribe`), and the full-text typeahead search endpoint
  (`/api/events`) - all additive read-only endpoints the frontend can keep
  calling against Prisma for now without blocking anything else in this
  pass.
- The admin "all events" bypass-filter listing (`all-events`, which
  disables `BASIC_EVENT_FILTER` for admins) and the TV/kiosk view - both
  just need a thin frontend wrapper around the existing `GET /events`
  once someone needs them; no new Go surface is obviously required.
- Nollning-specific event visibility (`showNollningEventsInstead`,
  `BASIC_EVENT_FILTER`'s nollning tag-prefix gate) - out of scope for the
  same reason nollning is out of scope everywhere else in this rewrite.

**Real bugs found in the old TS implementation, fixed rather than
replicated** (surfaced by a research pass before porting - see the git
history around this section for the full comparison):
- `removeCommentAction("EVENT")` (`src/lib/zod/comments.ts`) had **no
  authorization check at all** - any visitor could delete any comment on
  any event, despite `apiNames.EVENT.COMMENT_DELETE` existing and never
  being referenced. Go's `Service.RemoveComment` gates on
  `apinames.EventCommentDelete`, matching articles'
  `RemoveComment`/`NewsArticleCommentDelete` (which was already correct).
- `removeEventAction`'s `FUTURE` branch (`src/lib/events/server/removeEventAction.ts`)
  never redirected - it fell through with no return, unlike `ALL`/`THIS`.
  Go's `Service.Delete` completes uniformly for every scope.
- The old `getEvent(prisma, slug)` applied no `removed_at` filter at all,
  unlike `getAllEvents`'s list view - a soft-removed event was directly
  loadable by slug. Go's `Get` applies the same visibility rule as `List`;
  `GetAny` (unfiltered, for an editor) exists separately, mirroring
  articles' `Get`/`GetAny` split.

**Deliberate behaviors preserved, not simplified away:**
- **Recurring series are pre-materialized, not expanded at read time.**
  `Service.Create`, given `EventInput.Recurring`, inserts one
  `RecurringEvent` row plus one `Event` row per occurrence up front (same
  as the old `prisma.$transaction` loop) - list/detail reads never
  compute occurrences on the fly.
- **DST-safe wall-clock reconstruction.** Each occurrence's start/end keep
  the template's Europe/Stockholm wall-clock time-of-day (verified against
  the 2026-10-25 CEST→CET transition: occurrences on both sides of it keep
  the same local hour, with the UTC offset changing underneath). Go's
  `time.Date` does this correctly given a real `*time.Location`, unlike a
  naive UTC-arithmetic approach - no manual DST correction needed, unlike
  the old dayjs.tz(...).hour(...).minute(...) code which had to do this
  explicitly.
- **Series-edit semantics**: a `FUTURE`/`ALL`-scoped `Update` gives every
  affected occurrence the same new content, but each keeps its **own
  original date** - only the submitted start/end **time-of-day** shifts
  (`Service.retimeOccurrence`). Verified end-to-end: editing occurrence 3
  of a 5-occurrence weekly series with `scope=FUTURE` left 1-2 untouched
  and retimed 3-5 to the new time while preserving their original dates,
  including across the DST boundary.
- **Sequential per-occurrence slugs** (`my-event`, `my-event-2`, ...), not
  one shared slug across a series - verified in the same test.

**Deliberate divergences from the articles precedent, not oversights:**
- **`author_id` is never reassigned on `Update`**, unlike articles'
  documented "editing always re-attributes to whoever saves the edit."
  Events never had a mandate/custom-author byline picker to begin with -
  `author_id` here is purely a permission anchor (the "original author can
  still edit" bypass in `Service.Update`), not a displayed byline the way
  articles' `Author` is. Reassigning it on every edit would silently let
  any editor accumulate standing edit rights over other people's events
  and would strip the true organizer of their own bypass - actively
  harmful here in a way it isn't for articles. The free-text `organizer`
  field (unrelated to `author_id`) is what actually displays as "hosted
  by" and is freely editable like any other content field.
- **`Delete` has no author bypass**, only `apinames.EventDelete` - matches
  the old `removeEventAction`'s real permission check exactly (its
  `canEdit`-style author bypass was edit-only in the old code too, not an
  oversight to fix).
- **List/Get return summary-shaped attendance** (`goingCount`/
  `interestedCount`/`commentCount`, not full lists) - `EventDetail` adds
  the full `going`/`interested`/`comments` lists. The old Prisma
  `getAllEvents`/`getEvent` both eagerly loaded full lists even for list
  views (one shared `include`); this splits list/detail the same way
  articles' `ArticleSummary`/`ArticleDetail` already do, for the same
  reason (a list view has no business paying for full attendee lists).

**Mutual exclusivity of going/interested is enforced in code, not left to
convention.** The old TS only kept `going`/`interested` mutually exclusive
because exactly three fixed call sites always wrote both relations
together - nothing in the schema or a shared write path actually enforced
it. `PATCH /events/{slug}/attendance` is the *only* write path to either
relation, so `Service.setAttendance` enforces exclusivity structurally
instead of by convention. Verified end-to-end (going → interested cleared
`goingCount` and set `interestedCount`).

**Two refactors extracted from `internal/articles` while porting, not
events-specific but surfaced by needing the same logic twice:**
- `internal/slug` - `Slugify`/`SlugWithCount` moved out of
  `internal/articles` verbatim (events' recurring-series slugging needed
  the same functions).
- `internal/dbutil` - the ~10 small pgtype↔Go conversion helpers
  (`UUIDStr`, `TextPtr`, `ParseUUID`, `ResolveName`, ...) that
  `internal/articles/convert.go` had accumulated, exported and moved so
  `internal/events` didn't need its own copies.
- `internal/apitypes` (`Member`, `Tag`, `Comment`) - **not a refactor for
  its own sake, a required fix.** Both packages originally defined their
  own identically-shaped `Member`/`Tag`/`Comment` structs. That's fine for
  Go, but huma's OpenAPI schema registry names a component after the bare
  Go type name (not package-qualified), so registering both
  `registerArticleRoutes` and `registerEventRoutes` on one `huma.API`
  **panicked at startup** with "duplicate name: Member, new type:
  events.Member, existing type: articles.Member" - only caught by actually
  running the server, not by `go build`/`go vet`. Fixed by moving the three
  identical-shaped types into `internal/apitypes` and having both packages
  reference them via a type alias (`type Member = apitypes.Member`) rather
  than a new struct - every existing call site in both packages kept
  compiling unchanged, since an alias is the same underlying type, not a
  new one. **Any future domain package must check its DTO type names
  against every other registered package's for this reason** - it's a
  whole-API constraint, not a per-package one.

### Events frontend wiring (implemented 2026-09-01)

**Status: implemented**, as a follow-up pass to the backend port above -
same "data layer only" scope as the articles frontend integration
originally was: convert `src/lib/events/*` and
`src/routes/(app)/events/*`'s load functions/actions from Prisma to the
Go API, following the exact `+page.ts`/`+page.server.ts` split and
`$lib/api/client` conventions articles already established (see "API
shape and frontend integration" above). **Explicitly not in scope**:
designing or building the UI itself - `/events`, `/events/[slug]`,
`/events/all-events`, `/events/calendar` are all `<NotImplemented />`
stubs, and `create`/`[slug]/edit` have no `+page.svelte` at all (only
orphaned server logic) - discovered mid-pass, not something this work
changes. That's a substantially larger, separate UI-design effort.

Converted: list (`+page.ts`), detail (`[slug]/+page.server.ts` - kept
server-only rather than moved to `+page.ts`, see below), create
(`create/+page.ts`), edit (`[slug]/edit/+page.ts`), delete
(`removeEventAction`), going/interested (`interestedAction`), comments
(the `EVENT` branch of `$lib/zod/comments.ts`, which already had a `NEWS`
branch calling Go - this just added the matching call). All actions and
loads verified against a live Go backend + dev DB (create, recurring
series, edit, delete, going/interested toggle, comment) before considering
this done, same as the backend port itself was.

**Deliberately still Prisma-backed, not touched by this pass** - each
because its backing Go endpoint doesn't exist yet (see the Events section
above's "not ported this pass" list), not because it was missed:
`all-events` (admin bypass listing), `calendar`, `tv`, `subscribe` (ICS
feed), `id/[id]` (legacy slug-backfill redirect), and the nollning events
page. `src/lib/events/getEvents.ts` (`getAllEvents`/`getEvent`) and
`src/lib/events/events.ts` (`BASIC_EVENT_FILTER`, `eventLink`) stay in the
codebase for exactly these routes - don't delete them thinking they're
now dead, they aren't.

**One deviation from "every page moves to `+page.ts`," and why it's a
sanctioned exception, not a violation**: the event detail page
(`[slug]/+page.server.ts`) stayed a server-only load rather than moving to
`+page.ts`. It calls `getAllTaggedMembers` (`$lib/utils/commentTagging.ts`,
a real Prisma lookup for comment `@mention` resolution, shared with
articles - see the API shape section's note on this), which needs the
event's `comments` array as input - but that array only exists after
fetching the event from Go. A universal `+page.ts` load has no way to
sequence a Prisma call after a Go API call like that (server loads run
*before* universal loads and hand data forward, never the reverse). This
is exactly the case this doc's "Principles going forward" section already
carved out room for: "server-only load is a stopgap for routes that can't
do that yet, not the destination." `getAllTaggedMembers`'s own doc comment
already anticipated this exact migration (it was written to accept a
`{content}[]` shape matching the Go API's `Comment`, not a full Prisma
model), so nothing there needed to change.

**Two known gaps, both accepted because nothing currently renders the
pages that would surface them**:
- Push notifications to an event's organizer on going/interested aren't
  replicated client-side either, matching the backend's own "not ported
  this pass" decision - there's no member data to build the notification
  from on the frontend side of a Go API call anyway.
- The edit page's `+page.ts` can't prefill a recurring series' own
  settings (`recurringType`/`separationCount`/`recurringEndDatetime`) -
  Go's `EventDetail` only exposes `recurringParentId`, not the
  `RecurringEvent` row itself. `internal/db/queries/events.sql`'s
  `GetRecurringEvent` query exists but isn't wired to any HTTP route.
  Left as a documented gap rather than adding a new Go endpoint, since
  that would be expanding backend scope beyond what this pass was asked to
  do and nothing renders the edit form yet regardless. Revisit together
  once a real edit UI is built.

**Two small, deliberate behavior fixes surfaced in this pass** (beyond the
"real bugs" list already recorded in the Events section above, which were
fixed on the Go side): `interestedGoingSchema`'s field was renamed from
`eventId` to `slug` - the old Prisma code updated by id, but Go's
attendance endpoint is slug-keyed, and there was no consumer of the old
field name anywhere (`<NotImplemented />` stub pages) to break by renaming
it. The create-event form's schema previously also required an `editType`
field it never actually read (a copy-paste leftover from the update
schema) - dropped now that `createEvent`'s action no longer needs it.

## Mocking out-of-scope dependencies (generalized 2026-09-01)

**Status: decided.** This generalizes the Auth decision above to every
integration a ported feature depends on but that isn't built yet:
scheduling, push notifications, the Discord webhook, image storage, and
whatever else comes up later.

The rule: if an endpoint being ported depends on something out of scope,
**write the real call site in Go now, against an interface, and give that
interface a mock implementation that does nothing** — no real HTTP calls,
no real storage, no real scheduling. The mock doesn't need to fabricate
realistic data; a no-op that returns success (or a placeholder value
that's obviously a placeholder, like a fake URL) is fine. What matters is
that:

1. The *shape* is real — the Go code calls the interface exactly where and
   how the finished implementation will need to be called, so wiring in a
   real implementation later is a swap behind the interface, not a rewrite
   of the caller.
2. The corresponding logic is **deleted from SvelteKit immediately**, not
   kept around "just in case" or "until Go catches up." There is no bridge
   period where both sides can do a thing — Go owns it, unimplemented or
   not.
3. It's obvious from reading the code that it's a mock (name it
   `MockScheduler`, `MockNotifier`, etc.; log when a mock path is
   exercised if that's useful for noticing during dev).

Applied to what was previously listed as "explicitly deferred" — **all
implemented 2026-09-01** (`backend/internal/integrations`):

- **Image upload** → `Uploader.Upload`; `MockUploader` returns an
  obviously-fake `https://mock-uploads.invalid/...` URL without storing
  anything. `POST /uploads` (multipart) is the new Go endpoint; SvelteKit's
  `goApi.ts` `uploadImage()` calls it instead of the old bucket logic
  (`uploadFile`/`PUBLIC_BUCKETS_FILES`), which is no longer used by
  articles.
- **Push notifications / Discord webhook** → `Notifier` (`NotifyNewArticle`,
  `NotifyLike`) / `Webhooker` (`NotifyNewArticle`); both mock to a log line,
  no real call. The trigger logic (when to notify, not just the eventual
  sending) now lives in `articles.Service.syncNotifications`, called from
  `Create`/`Update`/`Like` - not in SvelteKit anymore.
- **Scheduled publishing** → `Scheduler` (`Schedule`/`Cancel`); mock returns
  a fake `mock-<hex>` id and no-ops `Cancel`. The old three-way toggle logic
  (previously scheduled → cancel / newly scheduled → schedule / unchanged →
  reschedule-via-external-PATCH) was simplified to two primitives
  (cancel-if-scheduled, then schedule-if-wanted) since the external
  scheduler-service's specific HTTP contract no longer needs preserving -
  this is equally correct for a real implementation, not just the mock.

The old SvelteKit-side code for all three
(`src/lib/news/server/notifications.ts`, `webhooks.ts`,
`src/lib/server/scheduleExecution.ts`, `getDecryptedJWT.ts`, and the
`/api/schedule/news` callback endpoint the external scheduler-service used
to hit) was deleted, not kept around - confirmed dead first (no remaining
importers) since Go now owns this unconditionally, mocked or not.

Not covered by this yet (still just "not ported," no interface needed
until something depends on it): the article moderation/request workflow,
and nollning-specific tag filtering (the nollning feature itself isn't
ported).

## Principles going forward

1. **Full replacement, not a bridge.** Don't shape the Go API around
   coexisting with Prisma or SvelteKit-server data access — assume that's
   going away entirely, including auth.
2. **Don't defer real work because a dependency isn't built.** Mock it
   behind a clean interface, build the intended shape now, and move the
   logic over immediately rather than leaving it stranded in the old
   backend "until X is ready."
3. **Prefer codegen over hand-maintained boilerplate** at the Go↔TypeScript
   boundary (OpenAPI, currently).
4. **SSR via SvelteKit universal load (`+page.ts`)** once the API supports
   client-authenticated calls; server-only load (`+page.server.ts`) is a
   stopgap for routes that can't do that yet, not the destination.
5. **Go is the sole source of truth for both validation and authorization
   - the frontend must never reimplement either, even client-side-only.**
   (Decided 2026-09-01, prompted by two things found in the same
   conversation: the articles/events like/RSVP/delete actions running
   zod validation through a SvelteKit server action before forwarding to
   Go, which re-validates anyway; and `canEdit`/`canDelete` being
   hardcoded `true` on both detail pages - see the correction above -
   because whoever would fix it reached for `isAuthorized`/`apiNames.ts`/
   `getDerivedRoles`, a TypeScript reimplementation of policy logic Go
   already has its own copy of.) The API is public and callable directly
   from the browser already (see "API shape and frontend integration"
   above), and a mobile app will call it too, going through none of
   SvelteKit's code at all - so any validation or authorization logic
   living in TypeScript is either (a) redundant, since Go has to enforce
   it for real regardless of what the frontend decided, or (b) a second,
   drifting copy of a rule the mobile app never sees and Go's tests never
   cover. Neither is acceptable as the target shape, even though today's
   TS-side checks are harmless in practice (Go's own enforcement doesn't
   weaken if the frontend's copy is wrong).
   - **Validation**: pure-proxy mutations (like/unlike, going/interested,
     delete, comment add/remove) should call the Go API directly from the
     client component - no SvelteKit server action, no zod schema for
     them. This isn't a new CSRF exposure: the session cookie is
     `SameSite=Lax`, which browsers withhold on cross-site requests
     regardless of whether the call goes through a SvelteKit action or
     straight to Go. Content-authoring forms (create/edit article/event)
     may keep client-side zod, but only as instant-feedback UX, not as a
     correctness or security boundary - Go's own validation is what
     actually decides whether a save succeeds, unconditionally.
     **IMPLEMENTED 2026-09-01.** The one mutation that actually had a live
     frontend consumer - article delete (`Article.svelte`'s delete
     dialog, and the same dialog on the edit page) - now calls
     `DELETE /articles/{slug}` directly from a shared
     `src/routes/(app)/news/RemoveArticleDialog.svelte` client component
     (toast + `goto` on completion), replacing the `removeArticle`
     SvelteKit action. Every *other* pure-proxy action
     (articles' like/dislike/comment/removeComment; events'
     comment/removeComment/removeEvent/going/interested) turned out to
     have **zero live frontend consumers** - not just under-tested, no
     `<form action="?/...">` or button anywhere referenced them (checked
     by grepping every route under `news`/`events` for the action names
     before deleting anything), a direct consequence of events' UI still
     being `<NotImplemented />` stubs and no like/comment UI ever having
     shipped for articles (see "Likes/comments are wired up... but
     unused" elsewhere in this file). Deleted rather than left in place:
     `src/routes/(app)/news/likes.ts`,
     `src/routes/(app)/news/[slug]/+page.server.ts` and
     `.../news/+page.server.ts` (both became empty once their only
     actions were removed), `src/lib/zod/comments.ts`,
     `src/lib/events/server/interestedGoing.ts`,
     `src/lib/events/server/removeEventAction.ts`, and
     `src/routes/(app)/events/+page.server.ts` (same "nothing left but an
     empty actions export" situation). Kept deliberately: `interestedGoingSchema`
     in `src/lib/events/schema.ts` (still used by the untouched
     Prisma-backed `all-events` admin page's form scaffolding - out of
     scope here, see "Not ported this pass" in the Events section) and
     `src/lib/news/server/actions.ts` / `src/lib/events/server/actions.ts`
     (create/update - real authoring forms with actual server-side work
     - image upload sequencing, redirect logic - not pure proxies, so
     Principle #5 doesn't apply to them; they keep their SvelteKit
     actions and zod). When like/comment/going-interested/event-delete UI
     eventually gets built, it should follow `RemoveArticleDialog.svelte`'s
     pattern (direct client call, no new SvelteKit action, no zod) rather
     than reintroducing the deleted action files.
   - **Authorization**: **FIXED 2026-09-01, same day it was flagged** -
     `canEdit`/`canDelete` (articles and events detail pages) are not
     "fixed" by calling `isAuthorized(apiNames.X, user)` client-side, even
     though `user.policies` is technically reachable there
     (`hooks.server.ts` → root `+layout.server.ts` → `parent()`) - that
     would have been the same reimplementation problem, just moved from
     `+page.server.ts` to `+page.ts`. Recall that Update/Delete already
     enforce a resource-specific bypass ("own article/event, or the
     `*Update`/`*Delete` policy") entirely inside `articles.Service`/
     `events.Service` - that's the one real implementation of "can this
     identity touch this resource." The actual fix: Go computes and
     returns that same answer as part of the resource response itself
     (`canEdit`/`canDelete` fields on `ArticleDetail`/`EventDetail`,
     computed in `Service.detail` from the exact logic `Update`/`Delete`
     already run - see the correction earlier in this file for the full
     detail), and all four frontend call sites read those fields instead
     of hardcoding `true` - zero authorization logic of any kind left in
     TypeScript. `src/lib/utils/authorization.ts`'s
     `isAuthorized`/`authorize`/`getDerivedRoles` are **not** deleted yet -
     still genuinely needed by the (unported) rest of the app - revisit
     once nothing else calls them.

## Roadmap: migrating the remaining backend (proposed 2026-09-01, not yet implemented)

**Status: proposed phase ordering, agreed 2026-09-01.** Phase 1 (directory
foundation) and phase 2 (nollning redesign, backend only) are now
implemented - see each phase's own status note below. **Superseded:** this
paragraph originally flagged the nollning subsection as "a proposal, not
yet decided in detail" with open questions to resolve during
implementation; both of those questions (permission model, organizing-
committee reference) were resolved when phase 2 was implemented - see the
"Nollning: proposed redesign" subsection's own updated status line, kept
as "proposed redesign" in its heading for historical continuity even
though it now describes what was actually built. Everything past
articles/events/auth/directory/nollning is still on Prisma. This section
records the agreed shape of the rest of the migration so it doesn't get
re-litigated phase-by-phase the way this doc exists to prevent for
everything else.

**Ground rules, carried over unchanged from articles/events:** huma +
sqlc + `ServeMux`, `internal/<domain>` service layer wrapping
`*db.Queries`, shared DTOs go in `internal/apitypes` (check new struct
names against every existing domain package first - see the huma gotcha
above), full-replace PATCH not partial-patch, acting identity from
`auth.Require`/context never from the request body, `+page.ts` +
`+page.server.ts`-actions-only on the frontend, no validation or
authorization logic re-implemented in TypeScript (Principle #5). Mocks
for out-of-scope dependencies (`Uploader`/`Notifier`/`Webhooker`/
`Scheduler`) get replaced **just-in-time**, in whichever phase first
needs them for real, not as a dedicated separate pass - see "Mock
replacement, just-in-time" at the end of this section.

**Explicitly out of scope, unchanged:** shop/tickets (never coming back,
see above). **Nollning is explicitly *in* scope and high priority** -
see its own subsection below; this reverses the treatment nollning has
gotten everywhere else in this doc so far (excluded from events'
visibility filtering, from auth's `SEE_STABEN` port, from the API shape
work) - those were correct calls for *not blocking* articles/events, but
nollning itself needs real, deliberate design, not permanent exclusion.

### Remaining domains, by rough size and current Prisma models

- **Directory/foundation**: fuller `members`/`mandates`/`positions`/
  `committees` (profile pages, editing, mandate history, committee pages)
  - partially in `schema.sql` already as an articles/events dependency,
  but only enough columns/queries to satisfy those two features, not a
  real member-facing feature. `AccessPolicy`, `EmailAlias` (admin-managed,
  small).
- **Nollning** (see below): `PhadderGroup`, nollning-specific fields on
  `Member`/`Mandate`, the `AdminSetting` nollning-period rows, and every
  scattered special-case inventoried below - not one Prisma model, a
  cross-cutting concern.
- **Simple standalone CRUD**: `Song` (songbook), `Markdown`/governing
  documents, `Document` (requirements/uploads), `Alert`, medals
  (`src/routes/(app)/medals`, no dedicated Prisma model - reads `Mandate`
  history).
- **File-storage-dependent**: gallery (photo albums - currently MinIO
  paths on disk, no Prisma model at all, listed via directory read) and
  `Document` uploads - both blocked on real `Uploader`, see mock
  replacement below.
- **Booking**: `Bookable`, `BookableCategory`, `BookingRequest`.
- **Expenses**: `Expense`, `ExpenseItem` - receipt uploads, approval
  workflow, blocked on real `Uploader` same as gallery/documents.
- **Elections**: `Election`, `ItemQuestion`/`ItemQuestionOption`/
  `ItemQuestionResponse` (the "yrka"/nomination workflow).
- **Cafe**: `CafeShift`, `DrinkItem`, `DrinkItemBatch`, `CiabattaOfTheWeek`,
  `SexetInventoryValueLog` - niche, low-traffic.
- **Notifications/webhooks, for real**: `Notification`, `ExpoToken`,
  `SubscriptionSetting` - replacing the `Notifier`/`Webhooker` mocks
  articles/events already call into.
- **Doors**: `Door`, `DoorAccessPolicy` - physical Salto hardware
  integration, not just a DB-backed feature.
- **Admin**: settings, links, minio browser, stocklist, debug, access
  policy management UI - mostly thin wrappers over the domains above,
  naturally lands after them.
- **Search**: cross-entity (members/articles/events/documents/...) -
  needs most of the above ported first to be worth doing for real.

### Phase order (dependency-driven, agreed 2026-09-01)

1. **Directory foundation** - full `members`/`mandates`/`positions`/
   `committees` CRUD and profile pages, `AccessPolicy`/`EmailAlias` admin
   management. Almost everything below displays or authorizes off member/
   mandate/committee data, including nollning's own role derivation -
   this has to be solid before nollning or anything else builds on it.
   **Status: implemented 2026-09-01, backend and SvelteKit frontend wiring
   both done** (`backend/internal/members`, `backend/internal/committees`,
   `backend/internal/accesspolicies` - see `backend/CLAUDE.md`'s "Directory
   routes" section for the exact endpoint list, every scope cut, and the
   frontend-wiring notes). Verified via `svelte-check`/`eslint` (0 errors)
   and live SSR + a real mutation round-trip against the dev DB, matching
   the standard the articles/events ports were held to.
   `positionToCommitteeMap` turned out not to need any change at all once
   actually wired up - Go addresses positions by full ID, and the
   frontend's existing short-URL scheme keeps working unmodified since
   position IDs themselves didn't change; the anticipated "port the map or
   switch URL schemes" fork never had to be taken. `apitypes.Committee`/
   `Position` gained a resolved `description` field (mirroring `Name`) and
   `Position.committee`/`Mandate.member` gained full sub-objects in the
   specific contexts that render them (a member's mandate history; a
   position's mandate-holder list) - gaps the backend-only pass hadn't
   surfaced yet, found once real frontend consumers existed. Two small
   accepted gaps remain, both pre-existing rather than introduced by this
   pass: `nollningGroupId`/onboarding's `email` field stay on a narrow,
   explicit direct Prisma write (see backend/CLAUDE.md); mandate
   update/delete flash messages no longer personalize with the member's
   name (Go has no single-mandate lookup, not worth a round-trip just for
   a display string). Board-page porting (SEE_STABEN staben-hiding) stayed
   deferred to Phase 2 exactly as planned below, not ported as a
   half-hack.
2. **Nollning redesign** (see below) - deliberately placed right after
   foundation and before any other feature phase, so nothing built from
   here on needs to route around nollning special-cases the way the
   current codebase does. Depends on mandates/positions (phadder-mandate
   detection) and access policies (`SEE_STABEN`) from phase 1.
   **Status: backend implemented 2026-09-01, frontend wiring implemented
   2026-09-02** (`backend/internal/nollning`, plus integration points in
   `internal/auth`, `internal/articles`, `internal/events`,
   `internal/committees`; SvelteKit side - board page, public/admin
   phadder-group pages, member profile/edit/onboarding, the `(nollning)/`
   phase-check layouts, `admin/settings`/`admin/debug` - see
   `backend/CLAUDE.md`'s "Nollning routes" section for the exact endpoint
   list and file list on both sides). Every "proposed" piece in the
   subsection below was built as designed, with the two previously-open
   questions resolved (see that subsection for both). Backend pass
   verified via `go build`/`go vet`/`go test ./...` and a live `AUTH_MOCK`
   smoke test against the dev DB: season create/current-phase transition,
   `GET /board` redaction wiring (mechanism verified by inspection - the
   mock authenticator always holds every policy including
   `member:see_staben`, so a live "viewer without the policy sees the
   position redacted" run wasn't possible without a second, differently-
   privileged mock identity), and a full article `PATCH` round-trip setting
   `nollningSeasonId` plus the resulting `GET /articles?nollningSeasonId=`
   filter. Frontend pass verified via `svelte-check`/`eslint` (0 errors)
   and a live SSR smoke test (both dev servers) of every rewired route.
   The frontend pass also found and fixed a real bug the backend pass
   introduced: `phadder_groups.year`'s removal (migrated by Go) had left
   `src/database/schema.zmodel` still declaring it, breaking every
   untouched `prisma.phadderGroup.*` call with no explicit `select` - see
   `backend/CLAUDE.md`'s "Prisma schema drift" note. **Still not part of
   any pass, deliberately**: a season picker UI on article/event
   create/edit forms (events don't even have a create/edit `.svelte` yet;
   articles' form sends `nollningSeasonId: null`, a valid value, until one
   exists), and the `(nollning)/` route tree's actual product UI content
   (unchanged, still `<NotImplemented />` stubs, including two pages whose
   `load`/`actions` got ported to Go server-side without a matching
   `.svelte` - same precedent as events' create/edit routes). Gallery's own
   staben redaction remains the documented Phase 4 gap it always was.
3. **Simple standalone CRUD** - songbook, governing documents, medals,
   alerts. No dependencies beyond phase 1, low risk, good for keeping
   velocity up after the heavier nollning phase.
4. **Real file storage + gallery + document uploads** - implement the
   real `Uploader` (S3/MinIO) once something (gallery) actually needs
   non-fake uploaded files to be useful; port document uploads at the
   same time since it's the same storage dependency. Gallery's
   staben-album date-filtering hack (see nollning section) gets replaced
   with a real `nollning.Season` check here, not re-implemented as a
   date-string folder parse.
5. **Booking** - bookables + booking requests.
6. **Expenses** - depends on phase 4's real uploader for receipts.
7. **Elections** - nomination/voting workflow.
8. **Cafe** - shifts + drink inventory.
9. **Real notifications + Discord webhook** - replace `Notifier`/
   `Webhooker` mocks for real, wired into every domain that already calls
   them (articles, events) plus whichever of phases 3-8 turned out to
   want notifications too. Nolla-specific default subscription settings
   (see nollning section) get their permanent home here instead of the
   current hardcoded-cutoff-date hack.
10. **Doors/Salto** - physical access control integration; kept late
    since it depends on real hardware/vendor API access, not just DB
    work, and nothing else in this list depends on it.
11. **Admin consolidation** - settings, links, minio browser, stocklist,
    debug - thin wrappers over domains that need to exist first.
12. **Search** - cross-entity search, deliberately last so it has
    something real to search across.

Not a numbered phase: rebuilding the actual nollning **frontend** UI.
Every `(nollning)/` page is currently a `<NotImplemented />` stub (see
inventory below) - phase 2 is about giving whichever team eventually
designs that UI (or the native app) a clean, non-hacky API to build on,
not about designing the UI itself. Treat that as a separate, later
product effort, not blocked on this backend work being "finished," only
on it existing.

### Mock replacement, just-in-time

Per the just-in-time decision: each mock gets replaced in whichever
phase first has a real dependent, not in one dedicated pass.

- **`Uploader`** (currently `MockUploader`, fake `mock-uploads.invalid`
  URLs) - replaced in **phase 4**, first real need is gallery.
- **`Notifier`/`Webhooker`** (log-only) - replaced in **phase 9**. Until
  then, articles/events keep calling the mocks exactly as they do today -
  no change needed to unblock earlier phases.
- **`Scheduler`** (fake `mock-<hex>` ids, no real scheduling) - no phase
  above obviously needs this for real; revisit only if a concrete need
  shows up (e.g. someone actually depends on scheduled-publish firing).
  Worth reconsidering **whether to keep an external scheduler-service at
  all** when this does come up - Go already owns the DB and could run its
  own cron-style check for due-to-publish articles internally, which
  would remove a whole service from the architecture rather than
  reimplementing its HTTP contract in Go. Not decided; flag for whoever
  picks this up.

### Nollning: proposed redesign

**Status: backend implemented 2026-09-01, frontend wiring implemented
2026-09-02** (`backend/internal/nollning` -
see `backend/CLAUDE.md`'s "Nollning routes" section for the endpoint list
and any small deviations from the shape proposed below). Kept as "proposed
redesign" in the heading since the rest of this subsection is left intact
as the design record; where implementation resolved something this
subsection originally left open, that's called out inline rather than
silently rewritten. Frontend work (season picker, phadder-group management
UI, the `/board` page, the `(nollning)/` route tree) is explicitly not
part of this - see the phase-order list above.

**Problem, per the 2026-09-01 codebase survey:** nollning is not one
feature with a clean boundary - it's three independent, overlapping
mechanisms, none of them first-class, glued together by booleans threaded
through unrelated query functions:

1. **A time window**, stored as two `AdminSetting` key-value rows
   (`nollning_start`/`nollning_end`) behind `isNollningPeriod()`
   (`src/lib/utils/adminSettings/nollning.ts`), cached in **module-level
   globals** with a 1-hour TTL (a staleness/test-isolation hazard, not
   just a style complaint - a setting change doesn't take effect for up
   to an hour, and tests sharing the module share the cache).
2. **A tag-string convention** for content: `[NOLLNING]` as a literal
   prefix (`src/lib/components/postReveal/types.ts:1`, note the
   surprising location) matched via `startsWith` against `Tag.nameSv`
   specifically (the Swedish name - not a dedicated field, not an enum,
   no DB constraint), consumed independently by
   `BASIC_EVENT_FILTER`/`BASIC_ARTICLE_FILTER`/`getAllTags`/
   `createMember`'s default-subscription lookup/the article-detail
   redirect-to-messages check. Nothing programmatically creates these
   tags - staff type the prefix into a tag's name by convention, so a
   typo or translation silently breaks every consumer at once.
3. **A per-member/per-mandate relationship**: `Member.nollningGroupId` →
   `PhadderGroup` (keyed by a bare `year: Int`, not tied to the time
   window in #1), plus `Mandate.phadderInId` and a *second*, independent
   phadder-detection path (`phadderMandateFilter`,
   `src/lib/nollning/groups/types.ts:19-27`) that hardcodes position IDs
   `dsek.noll.phadder`/`dsek.noll.uppdrag` plus a fixed Aug 1-Oct 1
   window.

On top of these three, at least **five separate hardcoded per-year
dates** exist with no shared source (`REVEAL_LAUNCH_DATE`, `nolla`'s
`CUTOFF_DATE`, the nollning-events page's `weekStarts` array, the phadder
group listing's `year: 2025` filter, `nollaNotifications`'s
`createdAt > 2025-06-26` cutoff) - each one is an independent
yearly-maintenance landmine, and several are already stale relative to
the current date. `SEE_STABEN` is injected as a side effect inside the
*global* access-policy-fetch hook (`hooks.server.helpers.ts`) rather than
being a visible, named part of any policy model. Phadder-group management
(`committees/nollu/groups/manage`) lives structurally outside both
`(nollning)/` and `admin/`, discoverable only by knowing it's there.

**A fourth thing the policy alone doesn't explain: what `SEE_STABEN`
actually hides.** The policy only controls who *has* it - the redaction
itself is implemented twice, independently, by whichever page needed it:
`board/+page.server.ts` filters out any board position whose `position.id`
starts with the string `"dsek.noll"` unless the viewer has `SEE_STABEN`
(a *third* hardcoded `dsek.noll*`-prefix convention, alongside
`phadderMandateFilter`'s `dsek.noll.phadder`/`dsek.noll.uppdrag` and the
`shortName === "nollu"` matches inventoried above); `gallery/+page.server.ts`
separately hides any photo album whose folder name parses to a date
*before* the active season's start, unless the viewer has `SEE_STABEN` (a
date-parsed-from-a-filename heuristic, unrelated to the board page's
mechanism even though both exist to keep the organizing committee's
identity secret pre-reveal). Two different ad-hoc definitions of "this is
staben" for what is conceptually one concern.

**Proposed shape in Go** - a single `internal/nollning` domain package
that every other domain depends on for nollning questions, instead of
each domain re-deriving its own answer:

- **`nollning_seasons` table** (new, Go-owned from the start - this is
  exactly the kind of first-class concept `schema.sql` should model
  rather than keep leaning on generic `AdminSetting` rows): one row per
  year, holding every date currently hardcoded or split across
  `AdminSetting`/`REVEAL_LAUNCH_DATE`/`CUTOFF_DATE`/`weekStarts` - at
  minimum `year`, `nolla_start_at`, `reveal_at` (pre-reveal → post-reveal
  transition), `end_at`. Adding next year's season becomes "insert one
  row," not "grep for hardcoded 2025s and hope you found them all."
- **`internal/nollning.Service`** is the only code in the whole backend
  allowed to know today's season. It exposes something like
  `Current(ctx) (*Season, bool)` (nil/false outside any season) and
  `Phase(ctx) Phase` (`Off`/`PreReveal`/`PostReveal`), computed straight
  from the DB (no module-global cache duplicating the current bug -
  ordinary request-scoped DB reads are fast enough here; revisit only if
  profiling says otherwise). Every other domain (events, articles,
  members, gallery, notifications) calls into this service rather than
  each computing "is it nollning right now" its own way.
- **Content classification: decided 2026-09-01, direct FK not tags,
  superseding an earlier tag-flag proposal floated in this same section.**
  The earlier idea (an `is_nollning boolean` column on `tags`) was
  rejected on reflection - a tag is a lightweight, user-assignable
  *topical* label, and nollning membership is a structural fact about a
  piece of content (which feed it belongs in, which year, what
  visibility/redirect rules apply). Conflating the two is the same
  category error the current `[NOLLNING]`-prefix convention already
  makes, just with a boolean instead of a string prefix - it would fix
  the typo/translation fragility but not the deeper problem. Decided
  instead: `articles` and `events` each get a nullable
  `nollning_season_id` FK straight to `nollning_seasons`. This gives real
  referential integrity (can't point at a season that doesn't exist),
  turns "this year's nollning content" into a direct indexed query
  (`WHERE nollning_season_id = $1`) instead of a name-prefix scan, and
  composes cleanly with ordinary tags - nollning content keeps whatever
  normal topical tags it wants alongside the season FK, since those are
  now orthogonal questions instead of the same mechanism doing double
  duty.
  - **Authoring workflow (as specified by the user 2026-09-01):** admins
    manage `nollning_seasons` (create a season, set the dates it spans -
    see the season fields above). Separately, whoever is authoring an
    article/event and holds the right permission can associate that
    content with a season - this is a normal field on the existing
    create/update forms (a season picker), not a separate workflow or
    endpoint. `articles.Service`/`events.Service`'s `Create`/`Update`
    only need to check that permission when the caller is actually
    setting/changing `nollning_season_id` to a non-null value - leaving
    it null, or resubmitting an unchanged value (recall update is
    full-replace, so every save resubmits the current value), doesn't
    require it. **Permission-gated, not time-gated**: association isn't
    restricted to "only while that season is currently active" - the
    natural workflow is picking the live season while it's running, but
    nothing stops an authorized editor from retroactively associating
    older content with a past season (e.g. fixing a miscategorized
    article), and this proposal doesn't add a special-case check to
    prevent that.
  - **Resolved 2026-09-01 (was left open here): one shared policy**,
    `apinames.NollningContentAssociate = "nollning:content:associate"`,
    checked identically from `articles.Service.Create`/`Update` and
    `events.Service.Create`/`Update` - the user confirmed this over the
    per-domain alternative when phase 2 was implemented, matching the lean
    already recorded below.
  - List/filter endpoints (`GET /articles`, `GET /events`) gain a
    `nollningSeasonId` query param, replacing today's boolean
    `showNollningEventsInstead` param and the tag-prefix filtering inside
    `BASIC_EVENT_FILTER`/`BASIC_ARTICLE_FILTER` - "the nollning feed" for
    a given year becomes an ordinary filtered list query instead of a
    special boolean threaded through otherwise-generic filter functions.
- **`SEE_STABEN` becomes a named, visible part of `internal/auth`'s
  policy resolution** - a documented function
  (`nollning.InjectStabenPolicy` or similar) called once from wherever
  Go resolves an identity's policies, reading `nollning.Service.Phase`
  instead of a side effect buried in a generic access-policy fetch. Same
  behavior (default-on outside nollning, opt-in during), just discoverable
  instead of hidden.
- **Staben membership becomes one real relationship, not two ad-hoc
  filters (decided 2026-09-01).** `internal/nollning` gets
  `IsStaben(ctx, memberID) bool`: true iff the member holds a currently-
  active mandate on a position belonging to *the* nollning organizing
  committee - resolved through the existing `committees`/`positions`/
  `mandates` tables, no new string convention needed. "Which committee is
  that" is itself an explicit reference - **implemented as the first
  option floated here**: `nollning_seasons.organizing_committee_id`
  (nullable FK to `committees`), defaulted at season-creation time to
  whichever committee has `short_name = "nollu"` (looked up once, not
  hardcoded elsewhere) but overridable per season, rather than a single
  immutable package-level setting - not a `shortName == "nollu"` /
  `position.id.startsWith("dsek.noll")` comparison repeated at every call
  site - this retires the board page's prefix hack and is one more
  instance of the `"nollu"` string-matching problem (alongside
  `phadderMandateFilter`, `positions.ts`'s committee map, `expenses/config.ts`,
  and the seed data) going away for good, not just for this one page.
  Paired with `CanSeeStaben(ctx, identity) bool` (the `SEE_STABEN`-or-
  season-inactive logic just above), the board listing's visibility
  becomes `IsStaben(member) && !CanSeeStaben(viewer)` → redact, instead of
  a prefix match. **Gallery's redaction stays a documented gap for
  phase 4, not solved here**: albums aren't modeled in the DB at all
  today (raw MinIO folder listings, no `Album` table), so there's nothing
  yet to attach a real flag to. When phase 4 ports gallery for real, the
  same pattern applies - give albums an explicit relationship (a
  `nollning_season_id` and/or a `staben`/hidden-until-reveal flag, set by
  whoever uploads it) instead of parsing a folder name as a date and
  comparing it to the season start.
- **Phadder-group membership becomes one function, not two independent
  ones.** `internal/nollning` owns both the `PhadderGroup`↔`Member` FK
  *and* the position-ID-based phaddrar detection
  (`dsek.noll.phadder`/`dsek.noll.uppdrag`), exposed as a single
  `PhadderRoleFor(ctx, memberID, season) Role` - today's two
  independently-maintained paths (`nollningGroupId` lookup vs
  `phadderMandateFilter`'s hardcoded position IDs + Aug-Oct window)
  collapse into one. `PhadderGroup.year int` becomes a
  `season_id` FK to `nollning_seasons`, fixing the "hardcoded `year: 2025`
  filter" staleness bug in the same pass. Phadder-group CRUD
  (`committees/nollu/groups/manage` today) moves into this package's
  routes, not scattered under a committee sub-path.
- **`getDerivedRoles`'s virtual `nolla` role** (classYear == current year)
  ports into `internal/nollning` alongside everything else here, reading
  the season table for "current year" instead of `new Date().getFullYear()`
  directly - a season boundary that crosses a calendar year (nollning
  starting in August) should resolve consistently with every other
  nollning date check, not independently.
- **New Go endpoints**, replacing the scattered `api/nollning`,
  `nollning/settings`, `admin/settings` (nollning half), and
  `committees/nollu/groups*` routes: `GET /nollning/current` (phase, active
  season, reveal date - what the frontend needs to pick a theme and route
  the native app, replacing `REVEAL_LAUNCH_DATE`/`CUTOFF_DATE`/
  `APP_PREFERRED_PAGE_COOKIE`'s date logic with one API call),
  `GET/POST/PATCH /nollning/seasons` (admin-managed, replacing the
  `AdminSetting` rows), `GET/POST/PATCH/DELETE /nollning/groups` (phadder
  group CRUD), `GET /members/{id}/phadder-role` or similar (replacing
  `phadderMandateFilter`-based lookups like `api/members/phadders`).
- **What this proposal deliberately does not touch**: the *frontend*
  theme system (`nollningPostReveal` in `themes.ts`) and the native-app
  routing cookie dance stay SvelteKit-side concerns - Go's job is to be
  the one correct source for "what phase/season/role is this," not to
  own theming. The `(nollning)/` route tree's actual UI content (wordlist,
  packing lists, wellbeing info, wikia pages) is content/product work,
  out of scope for this backend redesign - port whatever of it is still
  wanted once someone's designing that UI for real, using the new API
  instead of the old scattered Prisma/constant reads.
- **Migration note - done as described 2026-09-01**: three real
  `golang-migrate` migrations landed in `backend/internal/db/migrations`
  (`..._add_nollning_seasons`, `..._add_nollning_season_id_to_content`,
  `..._phadder_groups_season_id`), each with a working `.down.sql`,
  applied to the dev DB - exactly the shape described here (add
  `nollning_seasons`; nullable `nollning_season_id` on `articles`/`events`
  with a `[NOLLNING]`-tag-based backfill; `phadder_groups.year` →
  `season_id` with a backfill), not just a hand-edit to `schema.sql`. The
  backfills were written generically against real historical data, not
  simplified for it - the dev DB happened to have zero `phadder_groups`
  rows and zero `[NOLLNING]`-tagged content at implementation time, which
  was used only to confirm the migrations don't error on an empty case,
  never as a basis for the backfill logic itself. **Closed 2026-09-02**:
  per this doc's "no bridge period" principle, the old TS mechanisms this
  phase replaces were deleted once Go's replacement existed and every real
  consumer was rewired to it - see `backend/CLAUDE.md`'s "Nollning routes"
  section for exactly what got deleted vs. what stays (gallery's own
  `isNollningPeriod`/`getNollningStart` read, a genuine Phase 4
  dependency, not a bridge). This pass also caught a real bug the backend
  migration introduced: `phadder_groups.year`'s removal wasn't mirrored in
  `src/database/schema.zmodel`, breaking any untouched Prisma query
  against that table - see the same CLAUDE.md section's "Prisma schema
  drift" note. A useful precedent: whenever a future phase takes over
  migrations for another table Prisma still partially reads, check for
  this exact class of drift as part of that phase, not as an afterthought.
