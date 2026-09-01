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
