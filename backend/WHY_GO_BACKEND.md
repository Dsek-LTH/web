# Why we should rewrite the backend in Go

This document makes the case for the `backend/` rewrite: why the old SvelteKit/Prisma/ZenStack backend earned it, why the fix is a real API rather than a cleanup pass, and why that API is Go rather than SvelteKit (remote functions included). Every claim below is backed by real code — either still live in `src/`, or fixed during the port and logged in `backend/CLAUDE.md`/`DESIGN.md`.

## TL;DR

The old backend has no enforced boundary between the database, who's allowed to touch it, and what a page renders — all three live in whatever file a handler happens to be, held together by convention, not by anything the compiler checks. That was tolerable until two things became true at once: a native app is coming and can't run SvelteKit's server code, and the coupling has been hiding real security bugs — missing auth checks, hardcoded `true` bypasses. Go, with a code-first API framework (huma) and compile-time-checked SQL (sqlc), forces the separation the old code never had: get it wrong and it fails to build, not just review. Seven phases of real features have been ported this way already, and the frontend consuming them gets simpler as a direct result.

## 1. What's actually wrong with the old backend — and what replaced it

### 1.1 Business logic, auth, and data access tangled in one file

`src/routes/(app)/committees/cafe/+page.server.ts` is a representative example, not a worst-case one — this kind of file is the norm, not the exception, across `src/routes/(app)/**/+page.server.ts`. In ~50 lines it mixes: date-window math (`dayjs` week arithmetic), an inline authorization check, and a raw Prisma query, all in the `load` function:

```ts
function getWeek(weekString: string | null, user: AuthUser): dayjs.Dayjs {
  const currentWeek = dayjs().startOf("week");
  const weekNum = Number(weekString ?? currentWeek.week());
  if (!isAuthorized(apiNames.CAFE.SEE_ALL_WEEKS, user)) {
    if (weekNum < currentWeek.week() || weekNum > currentWeek.week() + 2) {
      error(403, { message: m.cafe_error_no_week_viewing_perms() });
    }
  }
  return dayjs()
    .startOf("year")
    .add(weekNum - 1, "week");
}
```

Its `updateSchedule` action goes further — zod validation, three `isAuthorized` calls interleaved with business rules, and a raw `prisma.cafeShift.findMany`, all in one function. There's no layer you could call "the cafe service" or "the cafe handler" — SvelteKit has no opinion about separating those, and nothing here introduced one. Section 2 shows the replacement: five files, five jobs.

### 1.2 A generic key-value table standing in for a real feature

"When does nollning start/end" used to live in a generic `AdminSetting` table, hand-parsed, behind a module-level 1-hour cache:

```ts
// src/lib/utils/adminSettings/nollning.ts
let cache: { value: boolean; lastFetched: Date } | null = null;
const CACHE_TIME = 3600 * 1000; // 1 hour

export const isNollningPeriod = async () => {
  const now = new Date();
  if (
    cache !== null &&
    cache.lastFetched.valueOf() + CACHE_TIME > now.valueOf()
  )
    return cache.value;
  const rows = await authorizedPrismaClient.adminSetting.findMany({
    where: {
      OR: [{ key: NOLLNING_START_KEY }, { key: NOLLNING_END_KEY }],
    },
  });
  const startStr = rows.find((row) => row.key === NOLLNING_START_KEY)?.value;
  const endStr = rows.find((row) => row.key === NOLLNING_END_KEY)?.value;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const isNollningPeriod = start < now && now < end;
  cache = { value: isNollningPeriod, lastFetched: now };
  return isNollningPeriod;
};
```

No `nollning_seasons` row, no year, no committee, no phase — two strings `new Date()`'d and compared to `now()`, stale for up to an hour and inconsistent across server instances. A load-bearing feature (staben visibility, phadder-group windows) running on a hack nobody would design on purpose.

**Now:** a real `nollning_seasons` table and a `Service` every other domain calls into:

```go
// Current returns the season whose window covers right now, or nil (not an
// error) if none does.
func (s *Service) Current(ctx context.Context) (*Season, error) {
 row, err := s.queries.GetCurrentSeason(ctx)
 if err != nil {
  if errors.Is(err, pgx.ErrNoRows) {
   return nil, nil
  }
  return nil, fmt.Errorf("get current season: %w", err)
 }
 season := toSeason(row)
 return &season, nil
}

// Phase reports where "now" falls relative to the current season.
func (s *Service) Phase(ctx context.Context) (Phase, error) {
 season, err := s.Current(ctx)
 if err != nil {
  return "", err
 }
 return phaseFor(season), nil
}
```

`Current`/`Phase`/`NollaYear`/`InjectStabenPolicy` are four documented, independently testable methods. No cache, no string parsing — `GetCurrentSeason` is an indexed query against a real table.

### 1.3 Authorization reimplemented at the call site, over and over

`isAuthorized(...)` is called **27 times across 18 files** (`grep -rn "isAuthorized(" src`), each a hand-written check re-derived wherever a route happens to need it — three separate times in `cafe/+page.server.ts` alone, none of them the same "can this user edit this shift" logic reused. There's no service method that owns the answer; it's scattered across whatever `.svelte`/`.server.ts` files needed a check. That count is from the _current_ tree, seven phases into the port — it's what's left after every already-ported feature moved its own call sites to Go's `auth.Require`, not the original size of the problem.

Some of this reimplementation happened **client-side**, computing the same decision the server separately re-checks — and it drifted: both the article and event detail pages had `canEdit`/`canDelete` hardcoded `true`, because reimplementing the check in TypeScript was never finished (`DESIGN.md`'s Principle #5 was written in direct response to this). And it's not just UI gating — mandate CRUD and governing-document create/update had **no server-side authorization at all**, relying solely on ZenStack's `@@allow` (1.4) as a backstop. None of this was exotic; nothing structurally required a mutation to declare its policy.

**Now:** every huma route runs through `auth.Middleware` once; a handler declares its policy requirement and the framework enforces it before the body runs — one call, one place, checked against a real `Identity` (policy strings are centralized in `internal/apinames`, section 5). Mandate and governing-document mutations are gated explicitly now; `canEdit`/`canDelete` are resolved server-side and just read by the frontend (section 7). Nollning's `InjectStabenPolicy`/`NollaYear` (1.2) follow the same discipline one level up, so no downstream domain reimplements "is this a nollning period" itself.

### 1.4 Schema, authorization, and access rules fused into one file

`schema.zmodel` is simultaneously the DB schema and the authorization policy, via ZenStack's `@@allow`:

```zmodel
model Article {
    // ...columns...
    @@allow("create", has(auth().policies, "news:article:create"))
    @@allow("read", has(auth().policies, "news:article:manage"))
    @@allow("read", auth().memberId == article.authorId)
    @@allow("update", has(auth().policies, "news:article:manage"))
    @@allow("delete", auth().memberId == article.authorId)
    @@allow("delete", has(auth().policies, "news:article:manage"))
}
```

Declarative-looking, but it means the whole app's authorization surface lives in one 1,365-line non-Go/TS DSL, enforced by a runtime Prisma wrapper (`enhance()`) that silently filters queries — you find out by an empty result, not a `WHERE` clause you can read. And `@@allow` isn't even the only place authorization is decided (1.3): two overlapping systems, no single source of truth. `auth.Require` (1.3) is that single source now.

### 1.5 A god-file `hooks.server.ts`

279 lines run on every request today — smaller than it used to be, since session/identity logic has already started moving to Go (see "Now," below); the original file was bigger and did even more in one place. What's still there: identity resolution, member bootstrapping, an anonymous-user cookie, a ZenStack-`enhance()`d Prisma client, an onboarding redirect buried in the middle, plus the ZenStack RPC mount, CORS, and metrics — one function doing all of it regardless of which feature the request is for.

**Now:** `auth.Middleware` resolves identity, `locale.Middleware` resolves locale, and nothing else does either job. The SvelteKit side shrank to asking Go "who is this" and building `locals` from the answer.

### 1.6 Stringly-typed logic producing silent bugs

- The old "minutes" resolver matched `["Protokoll", "Minutes, Minute"]` — a comma inside one string, so `"Minutes"`/`"Minute"` alone never matched anything. **Now:** three real substrings.
- Every document-delete action always deleted from the `documents` bucket, silently broken for SRD/requirement files that live in `files`. **Now:** the bucket is derived from the document type server-side.
- Gallery uploads pushed promises into a list that was never `await`ed. **Now:** `POST /gallery/upload` awaits every file.

None of these are exotic — they're what happens when logic is re-derived by hand at each call site instead of computed once, with no checkpoint to catch it.

### 1.7 Two features that look like one, because they share a table

`Markdown` backs both generic `/info` pages and each committee's about/links text; a separate `Document` model (governing documents) happens to share the `/documents` URL prefix with an unrelated MinIO file-browsing feature. Nothing about the naming distinguishes them — a natural result of a codebase with no domain boundaries. Go's package-per-domain naming (`internal/governingdocs` vs. `internal/markdown`) can't collide this way; huma refuses to register two packages under the same name at all.

## 2. One endpoint, top to bottom: `GET /songs/{slug}`

Every ported domain follows the same five-layer shape end to end. Here it is in full, for one real endpoint, each layer in its own file with exactly one job:

**1. Query** (`internal/db/queries/songs.sql`) — hand-written SQL, nothing else:

```sql
-- name: GetSongBySlug :one
SELECT id, title, lyrics, melody, category, created_at, updated_at, deleted_at, slug, video
FROM songs
WHERE slug = $1 AND (sqlc.narg('include_deleted')::bool IS TRUE OR deleted_at IS NULL);
```

**2. Generated types + query function** (`internal/db/models.go`, `internal/db/songs.sql.go` — sqlc output, never hand-edited):

```go
type Song struct {
 ID        pgtype.UUID        `json:"id"`
 Title     string             `json:"title"`
 Lyrics    string             `json:"lyrics"`
 Melody    pgtype.Text        `json:"melody"`
 Category  pgtype.Text        `json:"category"`
 CreatedAt pgtype.Timestamptz `json:"created_at"`
 UpdatedAt pgtype.Timestamptz `json:"updated_at"`
 DeletedAt pgtype.Timestamptz `json:"deleted_at"`
 Slug      string             `json:"slug"`
 Video     pgtype.Text        `json:"video"`
}

func (q *Queries) GetSongBySlug(ctx context.Context, arg GetSongBySlugParams) (Song, error) {
 row := q.db.QueryRow(ctx, getSongBySlug, arg.Slug, arg.IncludeDeleted)
 var i Song
 err := row.Scan(&i.ID, &i.Title, &i.Lyrics, &i.Melody, &i.Category,
  &i.CreatedAt, &i.UpdatedAt, &i.DeletedAt, &i.Slug, &i.Video)
 return i, err
}
```

**3. Convert** (`internal/songs/convert.go`) — the one place a database row ever becomes the API's shape:

```go
func toSong(row db.Song) Song {
 return Song{
  ID:        dbutil.UUIDStr(row.ID),
  Title:     FixSongText(row.Title),
  Lyrics:    FixSongText(row.Lyrics),
  Melody:    dbutil.TextPtr(row.Melody),
  Category:  dbutil.TextPtr(row.Category),
  Slug:      row.Slug,
  Video:     dbutil.TextPtr(row.Video),
  CreatedAt: dbutil.TimePtr(row.CreatedAt),
  UpdatedAt: dbutil.TimePtr(row.UpdatedAt),
  DeletedAt: dbutil.TimePtr(row.DeletedAt),
 }
}
```

**4. Service** (`internal/songs/service.go`) — auth, then business logic, nothing about HTTP:

```go
func (s *Service) Get(ctx context.Context, slugStr string) (*Song, error) {
 if err := auth.Require(ctx, apinames.SongRead); err != nil {
  return nil, err
 }
 row, err := s.queries.GetSongBySlug(ctx, db.GetSongBySlugParams{
  Slug:           slugStr,
  IncludeDeleted: dbutil.ToBool(canSeeDeleted(ctx)),
 })
 if err != nil {
  if errors.Is(err, pgx.ErrNoRows) {
   return nil, ErrNotFound
  }
  return nil, fmt.Errorf("get song: %w", err)
 }
 song := toSong(row)
 return &song, nil
}
```

**5. API handler** (`internal/api/huma_songs.go`) — typed request/response, nothing about SQL:

```go
type songSlugInput struct {
 Slug string `path:"slug"`
}
type songOutput struct {
 Body songs.Song
}

huma.Register(api, huma.Operation{
 OperationID: "get-song",
 Method:      http.MethodGet,
 Path:        "/songs/{slug}",
 Summary:     "Get a song by slug",
}, func(ctx context.Context, input *songSlugInput) (*songOutput, error) {
 song, err := svc.Get(ctx, input.Slug)
 if err != nil {
  return nil, humaServiceError(err)
 }
 return &songOutput{Body: *song}, nil
})
```

Five files, five jobs, and none of them know how to do each other's: the query doesn't know HTTP exists, the handler doesn't know SQL exists, `toSong` is the only place a database row and an API response ever touch. Swap "song" for "alert," "event," or any other ported domain and the file names change; the shape doesn't.

**The same feature, before the port.** Songbook is a clean before/after pair because it's literally the same feature — `git show a237153c^` (the commit immediately before Phase 3 ported it) has the real predecessor of the page above, not a reconstructed example:

```ts
// src/routes/(app)/songbook/[slug]/+layout.server.ts
export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  const accessPolicies = user?.policies ?? [];
  const isDeletedAccessible = canAccessDeletedSongs(accessPolicies);
  const client = isDeletedAccessible
    ? getExtendedPrismaClient(locals.language, user?.studentId)
    : prisma;

  const song = await client.song.findUnique({ where: { slug: params.slug } });
  if (song == null)
    throw error(404, { message: m.songbook_errors_songNotFound() });

  const [existingCategories, existingMelodies] = await Promise.all([
    getExistingCategories(client, accessPolicies, isDeletedAccessible),
    getExistingMelodies(client, accessPolicies, isDeletedAccessible),
  ]);

  const form = await superValidate(song, zod4(updateSongSchema));

  return {
    song: {
      ...song,
      title: fixSongText(song.title),
      lyrics: fixSongText(song.lyrics),
    },
    updateForm: form,
    existingCategories,
    existingMelodies,
  };
};
```

One function does: an authorization-flavored branch on which Prisma client to use, the actual fetch, 404 handling, two more queries for sidebar data, and superforms initialization — five concerns with no boundary between any of them, let alone five files. `getExistingCategories` (`songbook/helpers.ts`), one of those two sidebar queries, hand-reimplements what a single `SELECT DISTINCT` already does:

```ts
// src/routes/(app)/songbook/helpers.ts
export async function getExistingCategories(
  prisma: ExtendedPrisma,
  accessPolicies: string[] = [],
  includeDeleted = false,
): Promise<string[]> {
  if (!accessPolicies.includes(apiNames.SONG.DELETE)) includeDeleted = false;
  const existingCategories = (
    await prisma.song.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
      where: includeDeleted ? {} : { deletedAt: null },
    })
  ).reduce<string[]>((acc, cur) => {
    if (cur.category !== null) acc.push(cur.category);
    return acc;
  }, []);
  return existingCategories;
}
```

— fetch every row, then filter nulls in JavaScript with `.reduce`, instead of letting the database do it. `getExistingMelodies`, right below it in the same file, is the identical function with `category` swapped for `melody` — copy-pasted, not shared, because nothing forced a parametrized version into existence (compare Go's `ListDistinctSongCategories`/`ListDistinctSongMelodies`: one query each, no JS-side filtering at all). And the authorization check (`accessPolicies.includes(apiNames.SONG.DELETE)`) lives inline inside a function whose name is about categories, not permissions — there's no file here you could point to as "the songbook authorization layer" the way `auth.Require(ctx, apinames.SongRead)` unambiguously is one in the Go version.

**The same feature, now.** This is what the frontend actually looks like today, calling the five-file Go chain above — the current, live `src/routes/(app)/songbook/[slug]/+layout.ts`:

```ts
// src/routes/(app)/songbook/[slug]/+layout.ts
export const load: LayoutLoad = async ({ fetch, params }) => {
  const [songRes, categoriesRes, melodiesRes] = await Promise.all([
    api.GET("/songs/{slug}", {
      fetch,
      params: { path: { slug: params.slug } },
    }),
    api.GET("/songs/categories", {
      fetch,
      params: { query: { includeDeleted: true } },
    }),
    api.GET("/songs/melodies", {
      fetch,
      params: { query: { includeDeleted: true } },
    }),
  ]);

  if (songRes.error) {
    throw error(404, { message: m.songbook_errors_songNotFound() });
  }
  const song = songRes.data;

  return {
    song,
    updateForm: await superValidate(song, zod4(updateSongSchema)),
    existingCategories: categoriesRes.data ?? [],
    existingMelodies: melodiesRes.data ?? [],
  };
};
```

Compare line for line against the "before" version above: no branching on which Prisma client to use — Go's `Service.Get` already resolved that from the caller's identity before returning; no hand-rolled distinct-and-filter logic, since `/songs/categories` is just another typed endpoint; no `accessPolicies.includes(...)` check anywhere in this file, because there's no authorization decision left for the frontend to make. `song.title`/`song.lyrics` are rendered directly in `+page.svelte` with no `fixSongText` import at all, anywhere in the current songbook route tree — not because anyone was more careful this time, but because there's nothing left for the frontend to fix.

That last point is also the clearest illustration of what having no `convert.go` cost in the old version. `fixSongText` used to be applied at the return statement of _one specific route_, not attached to the data itself, so every other place a song got fetched had to remember to call it separately — and one did while another didn't. The old songbook **list** page's own load function (`songbook/+page.server.ts`, same pre-port commit) returned `prismaClient.song.findMany(...)` results straight through to its template with no `fixSongText` call anywhere in its load _or_ its `+page.svelte`. A song titled `Glunta -- en visa` therefore rendered literally as `Glunta -- en visa` in list/search results, and as `Glunta – en visa` (a real en dash) on that same song's own detail page — a real, verifiable inconsistency in the old app, confirmed by reading both files at that commit. It's structurally impossible now, not just fixed by someone remembering harder: `List` and `Get` both go through the same `toSong`, so there's no second call site left that could forget the step.

## 3. Why this needs to be a real API, not just a cleanup pass

**A native app is coming, and it can't run SvelteKit's server code.** Per `DESIGN.md`: "a mobile app will call it too, going through none of SvelteKit's code at all — so any validation or authorization logic living in TypeScript is either redundant, since Go has to enforce it for real regardless, or a second, drifting copy of a rule the mobile app never sees." A rule that lives only in a `+page.server.ts` action is invisible to that app by construction — it has to live somewhere a non-browser client can trigger and rely on.

**The coupling in section 1 is a security liability, not a style complaint.** Missing-auth bugs (1.3) and dual authorization systems (1.4) are exactly what "add more discipline" doesn't reliably fix, because nothing requires a mutation to declare its policy. An API layer where a handler doesn't compile or route without one closes that gap by construction, not by review vigilance.

## 4. Why Go?

There are really two options: keep everything in SvelteKit (optionally with remote functions), or build a real Go backend.

**The realistic SvelteKit alternative isn't `+page.server.ts` as-is — it's remote functions as a shared service layer.** Business logic moves into `.remote.ts` functions (SvelteKit's analogue of `service.go`); the website calls them directly; a thin `+server.ts` wraps the same functions in JSON for the app. A real, coherent design — that still loses to Go:

- **Two calling conventions, permanently.** The website calls logic in-process; the app calls the same logic through an HTTP wrapper — forever, not just during migration. Go has one interaction surface, used identically by both. Porting a feature to the app becomes "copy the API call the website already makes," not "write a new wrapper."
- **The wrapper doesn't reliably stay thin.** Several old `helpers.ts` files started as thin call-forwarders and grew real logic — this codebase has already broken that promise more than once.
- **Two call sites for the same logic is section 1.3's drift pattern, prospectively.** A check added to the wrapper and forgotten on the direct path (or vice versa) is exactly how `canEdit`/`canDelete` disagreed. One contract used identically by both clients has no second path to drift from.
- **It doesn't fix Prisma/ZenStack underneath** — the same `enhance()`-wrapped client and fused schema+policy file (1.4) either way.
- **Still shares the frontend's runtime and dependency graph** — one Node process, one `node_modules`, no independent scaling or deploy.

**What Go actually buys**, independent of the native-app question:

- **`internal/` is a compiler-enforced boundary; `.server.ts` is a naming convention.** The Go toolchain refuses to let outside code import `internal/` — a build error, not a lint rule. SvelteKit's equivalent is enforced by a Vite plugin at bundle time, invisible to `svelte-check`/SSR checks — and the identical mistake (a `.server.ts`-only import leaking into a universal `+page.ts` load) was made three separate times during this very migration, by people actively restructuring the code. A boundary that fragile isn't one a rotating volunteer base can rely on.
- **No shared module graph with the frontend, period.** No `package.json`, `node_modules`, or TypeScript program in common — there's no `import` statement, in either direction, that could cross the boundary by accident, because there's no shared build system to cross through.
- **A smaller stack per change.** Safely touching `cafe/+page.server.ts` needs SvelteKit's load/actions model, Prisma, ZenStack's `@@allow`, superforms+zod, dayjs plugins, and the `apiNames` convention — six things, one file. A Go domain package needs three, each in its own file, following a template a dozen-plus packages already demonstrate.
- **huma makes the typed contract the API.** The OpenAPI spec is derived from Go's own types at routing time — it can't drift the way a hand-maintained spec can. `openapi-typescript`/`openapi-fetch` generate the TS side straight from it (section 2's frontend snippet).
- **sqlc makes SQL bugs a compile error**, not a silently-empty result — the opacity problem is ZenStack's policy layer specifically, since Prisma's own queries are typed.
- **`auth.Require` is one enforcement point, not twenty-seven** (1.3).
- **Independent deploy and runtime** — a single Go binary, its own port, its own process lifecycle.
- **The compiler enforces the domain-package shape** (section 5): two packages defining colliding DTO names is a server-startup panic caught in development, not a review comment.

## 5. Structural comparison: standardized and modular vs. ad hoc

Every ported feature in the Go backend follows the _exact same_ three-piece shape:

```
internal/<domain>/service.go        — business logic, takes *db.Queries, knows nothing about HTTP
internal/api/huma_<domain>.go       — typed request/response structs, error mapping, calls the service
internal/db/queries/<domain>.sql    — hand-written SQL, compiled by sqlc into typed Go
```

That's true across all fourteen ported domains, enforced by convention **and** by real build failures if a package shortcuts it. `internal/apinames` centralizes every policy string in one file; `internal/apitypes` holds shared DTOs (`Member`, `Tag`, `Committee`, ...) that every domain references instead of redefining, since huma panics on accidental duplication and nothing forced the old codebase to notice the same duplication there.

This is also a case for physical separation as a _principle_: writing a Go handler means never thinking about how a Svelte component renders the response, and vice versa. That's a stronger boundary than "different folders, please don't cross the streams" — it's upheld by there being no shared compiler or import statement to cross with, not by anyone remembering a rule (section 4's `internal/` vs. `.server.ts` comparison shows how much weaker the in-one-codebase version is in practice). It also lets code be written top-down or bottom-up, in different phases, by different people, without special coordination.

Compare to the old structure from section 1: a `+page.server.ts` that's router+service+auth+data-access at once, a generic table standing in for a domain, two authorization systems with no owner. There's no per-feature "nollning service" file in the old app — the service is whatever scattered `.server.ts` files happen to import.

## 6. Maintainability, despite being a second service

The realistic future contributor doesn't already know this codebase's conventions — D-sek's volunteer population turns over, so SvelteKit familiarity is no safer an assumption than Go familiarity. The real comparison is "a large, unstructured monolith" vs. "small, identically-shaped packages," and the second ramps up faster regardless of which language someone already knows: safely touching `cafe/+page.server.ts` needs six entangled pieces of the stack in one file; extending a Go domain package needs three, each in its own file, following a template a dozen-plus packages already demonstrate. Read one, you've read the shape of all of them — the old codebase has no equivalent shortcut, because there isn't one pattern to learn.

This isn't just theoretical: convention-based separation already failed for people who _did_ know the codebase (the missing mandate/governing-doc auth checks, the bucket-routing bug, `canEdit`/`canDelete` — 1.3, 1.6), which is a worse starting point than a newcomer has to unlearn from. A mechanically-templated, compiler-enforced structure removes that failure mode rather than merely discouraging it.

What it buys day to day: the typed contract regenerates itself rather than needing maintenance; the domain pattern is mechanical to extend (follow the last one, not "figure out this corner of the monolith"); whole bug classes are excluded rather than just less likely (a bad SQL column is a build failure, not an empty result — the same "compiler catches it" property covers auth and DTO collisions too, sections 4–5); and it's still one Postgres, not a distributed-systems rewrite — the added surface is one more Go binary, not one more source of truth for data. The honest tradeoff: more total infrastructure than one Node process, for each piece of it being simpler and harder to silently misuse.

## 7. The frontend gets simpler, not just the backend

Once a domain is ported, SvelteKit collapses to "call the generated client, render the result":

- `client.ts` + `schema.d.ts`, generated from Go's own `/openapi.json`, are the _entire_ integration surface — no hand-written DTOs or fetch wrapper, full autocomplete straight from the Go structs.
- Every translated field ships both the raw pair and one resolved field computed server-side — display code just reads it. (No more `translationExtension.ts` - TACK OCH LOV 🎉)
- `+page.ts` calls the Go API directly from the browser, since it's a real public HTTP surface with its own auth — this is what let create/edit pages drop their client-side auth/validation duplication (1.3).
- `canEdit` and similar server-computed fields (1.3) mean the frontend reads a boolean instead of recomputing a policy decision — fewer lines of TypeScript per page, not just a security stance.

Once ported, pages get shorter and more mechanical — the logic isn't rewritten in TypeScript a second time, it's rendered.

## 8. Why separating concerns this way, specifically, is worth it

Every section above makes the same point in a different place: this rewrite introduces **enforced boundaries** where the old codebase had **conventions that were easy to skip**.

| Boundary                       | Old codebase                                                     | New codebase                                           |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------ |
| HTTP vs. logic vs. data access | One `+page.server.ts` function, all three                        | Three files, one job each                              |
| Authorization                  | `isAuthorized()` at 27 sites + `@@allow` — two systems, no owner | `auth.Require`, one check per route, one policy source |
| API contract                   | Hand-written, driftable                                          | Generated from Go's types, can't drift                 |
| SQL correctness                | Runtime-checked via `enhance()`                                  | Compile-time-checked via sqlc                          |
| Shared DTOs                    | Redefined per feature                                            | Shared; huma panics on duplication                     |
| Client reach                   | Browser only                                                     | Browser and a native app, one real API                 |

None of these are stylistic. Each is a place the old architecture let a real defect — a missing auth check, a stale cache, a drifted client/server check, a typo'd substring — ship and survive, because nothing in the structure required it to be caught. That's the actual argument for a real backend rewrite instead of a refactor of the code that produced those bugs.
