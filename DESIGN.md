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

## Shop / tickets: cut from scope entirely (decided 2026-09-01)

**Status: decided.** The shop/ticket/payment domain (Prisma models
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
- **SvelteKit-side removal is immediate and complete, not deferred.**
  `src/lib/server/shop/`, `src/lib/utils/shop/`, the `/shop` and
  `/shop/tickets` routes, the event scan/check-in route, and the nollning
  shop route are deleted along with their nav links and any component that
  exists only to render ticket/purchase UI — not left in place "in case
  something still imports them." Same standard as the rest of this doc:
  confirm dead (no remaining importers) before deleting, don't leave a
  Prisma-backed path alive for a feature that isn't coming back.
- **Open follow-up, not yet decided:** whether the underlying Postgres
  tables (`shoppables`, `tickets`, `orders`, `order_items`, `payments`,
  `consumables`, `consumable_reservations`, `shoppable_access_policies`)
  get dropped via a real Prisma migration, or just left in place, unused,
  in the live dev DB. Dropping tables in the shared live database is a
  more consequential, harder-to-reverse step than deleting application
  code, so it's being treated as a separate decision to make explicitly
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
