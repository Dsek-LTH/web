# Review tasks: go-backend vs the old SvelteKit app

Findings from a review of the `go-backend` branch against the old
SvelteKit/Prisma app (`main`), mostly unintended behaviour differences.
Each task is meant to be picked up on its own: it names the files, the old
behaviour to restore and how to check the fix. Read `AGENTS.md` first for
the conventions (Go owns validation and authorization, additive-only API,
`make generate` / `pnpm generate:api` after API changes, authz tests in
`apps/api/internal/api/authz_*_test.go`).

"Old" paths are in the `main` branch (`git show main:<path>`); "new" paths
are on this branch. Line numbers are approximate.

How to work on this file:

- Mark a task `[x]` in the same commit that fixes it, and add the commit
  subject's short form after it if useful.
- If a task turns out to be wrong or intentional, mark it `[x]` and write
  `Won't fix: <reason>` under it.
- Keep fixes small and one task per commit where practical.

Decided and not tasks (confirmed with the maintainers):

- The session cookie domain is fine: PR previews use a different provider
  than prod.
- `core:member:read`, `event:read` and `booking_request:bookable:read` are
  granted to everyone in prod, so gates on them are equivalent to the old
  code.
- The native app doesn't exist yet, and the removed `/api/nollning`,
  `/api/search`, `/api/events`, `/api/closeAlert` and `/api/model/*`
  endpoints don't need replacing.

## P1: fix before cutover

### [x] T01 Posting an article under a mandate byline always fails

- New: `apps/web/src/lib/news/authorOptions.ts` maps each mandate to
  `{ type: "Mandate", member, position }` and drops `mandate.id`;
  `toAuthorInput` then sends `mandateId: author.position?.id` (a dotted
  position id like `dsek.cafe.mastare`). Go's `resolveAuthor`
  (`apps/api/internal/articles/service.go`, `dbutil.ParseUUIDPtr(in.MandateID)`)
  answers 422 "invalid mandate id".
- Old: `main:src/lib/news/getArticles.ts` built options with
  `mandateId: mandate.id`.
- Fix: carry the mandate id in the option (add `mandateId` to
  `authorOptionSchema` in `apps/web/src/lib/news/schema.ts`, set it from
  `mandate.id` in `buildAuthorOptions`, compare it in `sameAuthorOption`)
  and send it from `toAuthorInput`. Check the edit page's preselection of
  the current author still matches (`news/[slug]/edit/+page.ts`).
- Verify: unit test for `toAuthorInput`; create an article as a mandate in
  dev.

### [x] T02 Editing an article makes the editor its author

- New: `articles.Service.Update` (`apps/api/internal/articles/service.go`
  ~line 306) calls `resolveAuthor(ctx, identity.MemberID, in.Author)`, so an
  admin editing someone else's article becomes the author (byline, and the
  original author loses the owner check and `canEdit`).
- Old: `main:src/routes/(app)/news/[slug]/edit/+page.server.ts` and
  `main:src/lib/news/server/actions.ts` kept the original author's member.
- Fix: when the editor isn't the current author's member, keep the existing
  `author_id` unchanged (ignore `in.Author`). Only re-resolve when the
  author edits their own article. Update the operation description in
  `huma_articles.go` ("The editor becomes the author") and the comment in
  `apps/web/src/routes/(app)/news/[slug]/edit/+page.ts`. On the edit page,
  a non-author editor should see the author picker disabled or showing the
  current author.
- Verify: a test in `internal/articles` (uses the dev DB in a rolled-back
  transaction) that an update by another member with
  `news:article:update` keeps `author_id`.

### [x] T03 Write-time sanitizing turns `'` and `"` into `&#39;` / `&#34;`

- New: `bluemonday.UGCPolicy().Sanitize` runs on markdown and plain text at
  write time in `internal/articles` (bodies, comments), `internal/events`
  (descriptions, comments), `internal/songs` (title, lyrics, melody),
  `internal/markdown` (info pages), `internal/nollning`,
  `internal/committees`. bluemonday HTML-escapes quotes in text, so they are
  stored as entities and show literally in edit forms, code spans, the ICS
  feed, Discord embeds, push text and song pages (rendered as plain text).
- Old: `DOMPurify.sanitize`, which leaves `'` and `"` in text alone. Melody
  was only trimmed.
- Fix: add one shared helper (e.g. `markdown.SanitizeSource(string) string`
  in `internal/markdown`, or `internal/sanitize`) that runs the UGC policy
  and then turns `&#39;` and `&#34;` back into `'` and `"` only outside
  tags (in bluemonday's output any raw `<` starts a tag; inside a tag the
  entities must stay, since they protect attribute values). Use it
  everywhere bluemonday is used now. Songs: melody is trimmed only.
  Comments (`comments.Normalize`, 255 chars): check the length after
  sanitizing so a long comment can't overflow `VARCHAR(255)` with a 500.
- Verify: table test for the helper (`it's "x"` survives, `<a
title="a&#34;b">` keeps its entity, `<script>` is removed); `go test
./...`.

### [x] T04 Notification text is cut by bytes, splitting å/ä/ö, and the insert fails

- New: `apps/api/internal/notifications/notifier.go` `stripToText` returns
  `s[:limit]`; `service.go` `Send` cuts `title[:251]` / `message[:251]`;
  `webhook.go` `limitDescription` and `fullName` also cut bytes. Invalid
  UTF-8 makes Postgres reject `CreateNotifications`, so the announcement
  sweep retries and gives up and nobody is notified. The fallback text is
  also no longer stripped of markdown.
- Old: `markdownToTxt(body).slice(0, 254)` and `substring(0, 251)` (UTF-16,
  never invalid).
- Fix: a rune-safe truncate helper used in all four places; strip markdown
  (and unescape entities) before cutting in `stripToText`, e.g. render with
  goldmark and drop tags, or a simple regex strip of `**`, `#`, links and
  images.
- Verify: unit test with a string of `å` crossing the limit gives valid
  UTF-8 (`utf8.ValidString`).

### [ ] T05 Staben is only hidden on /board and in the gallery

- Old: `main:src/database/schema.zmodel` denied reading mandates on
  `dsek.noll.stab.mdlm` / `dsek.noll.stab.oph` without `member:see_staben`
  (except to the holder) (~line 548); hid `Author`s posted as a
  `dsek.noll.stab.*` mandate or by a current stab member (~lines 174,
  194-197); and hid current stab members' email (~line 645). The policy is
  withheld during a season (still true:
  `nollning.Service.InjectStabenPolicy`).
- New: only `committees.Service.ListBoard` and `gallery.Service` check
  `apinames.MemberSeeStaben`. `nollning.Service.IsStaben` is unused.
  Unfiltered: `members.Service.Profile` mandates (and email),
  `committees.Service.GetByShortName` (nollu committee page),
  `committees.Service.GetPosition`, article authors in
  `internal/articles` (list and detail), member search results if they show
  mandates.
- Fix: factor the board's check (`committees/service.go` ~lines 311-356:
  organizing committee of the current season, caller lacks
  `MemberSeeStaben`, caller isn't the member) into a helper and apply it in
  each place: drop hidden mandates, blank the email in `Profile`, and for
  article authors replace a stab author's member/mandate with nothing
  shown (or drop the mandate and member, keeping only custom bylines).
  Mind import cycles: committees already redacts without importing
  `internal/auth` helpers; reuse that pattern.
- Verify: authz cases in `authz_directory_test.go` with an active season:
  a member without `member:see_staben` doesn't see stab mandates on a
  profile, the nollu committee, the position page or an article byline; the
  stab member sees their own.

### [x] T06 `foodPreference` is returned to every signed-in member

- New: `members.Service.Profile` (`apps/api/internal/members/service.go`
  ~line 210) always sets `FoodPreference`.
- Old: `schema.zmodel` ~line 656 allowed reading it only for the member
  themselves, `webshop:manage` or `core:member:update`.
- Fix: set it only when the caller is the member or has
  `apinames.MemberUpdate` (the webshop is gone; check whether a ticket
  roster permission should also see it - the roster has its own query).
- Verify: authz test: another member gets no `foodPreference`; self and
  `core:member:update` do.

### [ ] T07 Nollor can't pick their own phadder group; profile saves can remove one

- New: `apps/web/src/lib/utils/member.ts` `setNollningGroup` calls
  `POST /nollning/phadder-groups/{id}/nollor` and
  `DELETE .../nollor/{studentId}`, which need
  `nollning:phaddrar:groups:manage` (`nollning/service.go` ~lines 447, 469),
  and ignores the result. Used by `onboarding/+page.server.ts`,
  `members/[studentId]/+page.server.ts` (modal and update) and
  `members/[studentId]/edit/+page.server.ts`, which all report success.
  The profile has no `nollningGroupId`, so edit forms always post `null`,
  which removes the member from their group when the caller holds the
  manage policy.
- Old: a member could update their own `nollningGroupId`
  (`schema.zmodel` Member `@@allow('update', auth().studentId == studentId)`);
  fields not posted were left unchanged.
- Fix: add `PUT /members/{studentId}/phadder-group` (body
  `MemberPhadderGroupInput { groupId?: string }`, empty clears) allowed for
  the member themselves or the manage policy, limited to groups of the
  current season (422 otherwise). Add `nollningGroupId` (optional) to the
  member profile response for the member themselves / the manage policy,
  so forms can prefill it. In SvelteKit, only call the endpoint when the
  value changed, and surface errors. Add authz cases (self allowed, other
  member denied, manager allowed).

### [ ] T08 Any profile save clears `graduationYear`

- New: `members/[studentId]/+page.server.ts` and `edit/+page.server.ts`
  `PUT /members/{studentId}` (full replace) with
  `graduationYear: profileFields.graduationYear ?? undefined`, but
  `MemberForm` has no such field, so Go writes NULL.
- Old: partial Prisma update; untouched fields stayed.
- Fix: carry `graduationYear` over from the loaded profile (onboarding
  already does this), in both actions. Check the other fields the PUT
  requires but the form doesn't send (compare `MemberProfileInput` in
  `internal/members/types.go` with the form schema).

### [x] T09 Event image upload needs `news:article:create`

- New: `apps/web/src/lib/events/server/actions.ts` uploads through
  `POST /images` (`articles.Service.UploadImage`, needs
  `NewsArticleCreate`). Without it the whole event create/edit fails with
  403 before the event is saved.
- Old: uploaded to `public/events/<slug>` with the files bucket permission.
- Fix: let `UploadImage` accept `news:article:create` **or**
  `event:create` / `event:update` (or add `POST /events/images`, stored
  under `public/events/`). Update the operation description and the authz
  test for `/images`. Image validation/compression is T21.

### [x] T10 Migration `20261103200001` can abort the cutover

- New: `apps/api/internal/db/migrations/20261103200001_access_policy_exactly_one_of_role_or_student.up.sql`
  adds `CHECK ((role IS NOT NULL) <> (student_id IS NOT NULL))` with no
  cleanup. The old info-page edit (`studentId: user?.studentId`, no role)
  could write rows with both NULL; one such row makes `migrate up` fail and
  the API never starts.
- Fix: before the `ALTER TABLE`, delete rows where both are NULL (they
  grant nothing usable) and, for rows with both set, keep the role and
  null the student id (or split into two rows). Mention in the migration
  comment. Before cutover also run
  `SELECT * FROM api_access_policies WHERE (role IS NULL) = (student_id IS NULL)`
  on prod to see what will change.

### [x] T11 New policies are granted to nobody in prod

- New: `nollning:season:manage` and `nollning:content:associate`
  (`internal/apinames`) are only granted by the dev seed. After cutover
  nobody can manage seasons. `nollning:content:associate` is also missing
  from `apps/web/src/lib/utils/apiNames.ts`, so `/admin/access` doesn't list
  it.
- Old: the nollning window was edited with `admin:settings:update`.
- Fix: a migration inserting `api_access_policies` rows: grant
  `nollning:season:manage` to every role that holds
  `admin:settings:update`, and `nollning:content:associate` to every role
  that holds `nollning:phaddrar:groups:manage` (plus `dsek.infu` if
  present), with `ON CONFLICT DO NOTHING`-style guards (there is no unique
  index; use `WHERE NOT EXISTS`). Real `.down.sql` deleting those rows. Add
  the missing name to the frontend apiNames.

### [x] T12 Phadder mandate check requires covering the whole season

- New: `apps/api/internal/db/queries/nollning.sql` `FindActivePhadderMandate`
  has `start_date <= $2 AND end_date >= $3`, called with
  `StartDate = season start`, `EndDate = season end`
  (`nollning/service.go` ~line 540), i.e. the mandate must span the whole
  season (the sqlc positional-param gotcha).
- Old: `main:src/lib/nollning/groups/types.ts` `phadderMandateFilter`:
  overlap.
- Fix: `start_date <= sqlc.arg('season_end') AND end_date >= sqlc.arg('season_start')`,
  `make generate`, update the call site.

## P2: should fix

### [ ] T13 Booking writes aren't transactional

- New: `apps/api/internal/booking/service.go` `Create` (~361-401), `Update`
  (~467-495), `SetStatus` (~580-594), `Delete` run separate auto-committed
  statements; doors/members are validated (`access.go` `setAccess`) after
  the request row is written. Errors leave orphaned requests or stale door
  access.
- Old: one nested Prisma write.
- Fix: run each in a transaction (`pgx.BeginFunc`, see
  `tickets.withReleaseLock`; the service needs the pool, not just
  `db.DBTX`), validate doors/members/bookables before the first write, and
  lock the request row (`SELECT ... FOR UPDATE`) in Update/SetStatus.

### [ ] T14 Booking admin pages lack an update gate; access lists leak to readers

- New: `apps/web/src/routes/(app)/bookings/admin/+page.server.ts` and
  `admin/[id]/+page.server.ts` have no `requirePolicy`. Go's List/Get attach
  `accessMembers` / `accessDoors` for every `booking_request:read` holder.
- Old: both admin loads `authorize(BOOKINGS.UPDATE)`; the plain list didn't
  include access lists.
- Fix: `requirePolicy(locals.user, apiNames.BOOKINGS.UPDATE)` in both
  loads; in Go only attach access lists for `booking_request:update`
  holders or the booker. Authz case.

### [ ] T15 Salto loses its backup-list fallback when Go is down

- New: `hooks.server.ts` calls Go `/me` for every request and returns 502
  if it fails (`apps/web/src/lib/server/goAuth.ts`), and
  `routes/(app)/salto/[door]/+server.ts` passes on Go's answer (500 if Go
  is unreachable). The fallback only exists inside Go.
- Old: try/catch returning `BACKUP_LIST_OF_STUDENT_IDS`
  (`main:src/routes/(app)/salto/[door]/+server.ts`).
- Fix: skip the identity lookup for `/salto/` paths in the hooks (and
  paraglide's locale strategy if it triggers it); in the proxy, on a thrown
  fetch or non-200, return the backup list as `text/plain` (copy the list
  from Go's `internal/doors`, keeping both in sync with a comment). Output
  for the normal case must stay byte-identical.

### [ ] T16 A session for a deleted member breaks the whole site

- New: `apps/api/internal/auth/real.go` `resolveIdentity` returns
  `pgx.ErrNoRows` as an error; `Middleware` answers 401 on every route
  (including `/auth/login` and `/auth/logout`); SvelteKit turns that into a
  502 on every page.
- Old: re-created the member.
- Fix: treat a missing member as an invalid session: clear the cookie and
  continue as anonymous. Unit test in `internal/auth` if a harness exists.

### [ ] T17 No CSRF protection on Go writes

- New: `apps/api/internal/api/router.go` `withCORS` sets headers only;
  `SameSite=Lax` cookies ride on simple cross-origin POSTs from sibling
  hosts, and huma decodes a body without Content-Type as JSON.
- Fix: wrap the handler in `http.NewCrossOriginProtection()` with
  `AddTrustedOrigin(PUBLIC_FRONTEND_URL)` (server-to-server calls send no
  `Sec-Fetch-Site`/`Origin` and pass). Keep `/auth/*` GETs working (GETs are
  exempt). Check the e2e tests and `make dev` still work (frontend on
  another origin in dev too).

### [ ] T18 `/positions` lists everything under "No committee"

- New: `GET /positions` (`committees.Service.ListPositions`,
  `queries/positions.sql`) doesn't return the committee;
  `routes/(app)/positions/+page.svelte` groups by `position.committee?.name`.
- Fix: join the committee (name sv/en, short name) and set
  `Position.Committee`.

### [ ] T19 Café schedule week numbering breaks in 2027

- New: Go uses ISO weeks (`cafe.Service.GetSchedule`, `mondayOfISOWeek`);
  `routes/(app)/committees/cafe/schedule/+page.svelte` builds the week with
  `dayjs().startOf("year").add(week - 1, "week")` and navigates with
  `week()`. They disagree when Jan 1 is Fri-Sun (2027).
- Fix: build the displayed week from Go's `{year, week}` with dayjs'
  `isoWeekYear(year).isoWeek(week)` and navigate with `isoWeek()` /
  `isoWeekYear()`, sending `year`.

### [ ] T20 Scheduled articles can't be found

- New: no endpoint lists unpublished articles and `/news` lost the
  "Scheduled news" section (`main:src/routes/(app)/news/+page.server.ts`
  ~43-81, `+page.svelte` ~40-58).
- Fix: `GET /articles?onlyUnpublished=true`: the caller's own future
  articles, or all with `news:article:update`; restore the section on
  `/news` (signed-in only). Additive API change.

### [ ] T21 Image uploads: no type check, no resize, no orientation fix

- New: `POST /images` (`articles.Service.UploadImage`), gallery
  `UploadAlbum` and documents image uploads store the raw bytes;
  `storage.Store.Upload` sets the content type from the extension, so
  `.html`/`.svg` can be stored in the public bucket. Multipart bodies have
  no size limit.
- Old: `isFileImage` check, sharp `.rotate().resize(1920).webp()`
  (`main:src/lib/files/uploadFiles.ts`).
- Fix: in Go, sniff (`http.DetectContentType`) and accept only
  jpeg/png/webp/gif for `/images` and gallery; decode, apply EXIF
  orientation, downscale to max 1920 px wide and re-encode (JPEG is fine if
  a pure-Go webp encoder isn't wanted; note the extension change). Set a
  max body size on the upload operations.

### [ ] T22 Calendar feeds ignore the client's language

- New: `routes/(app)/events/subscribe/+server.ts` and
  `routes/(nollning)/nollning/events/subscribe/+server.ts` fetch Go on
  another origin without forwarding `accept-language`, so Go answers in
  English.
- Fix: forward the request's `accept-language` header. Also add
  `X-PUBLISHED-TTL:PT1H` after `METHOD:PUBLISH` in
  `apps/api/internal/events/calendar.go` (the old `ics` library emitted
  it).

### [x] T23 Committee page markdown is stored unsanitized and rendered with `{@html}`

- New: `committees.Service.upsertMarkdown` writes raw input; rendered by
  `committees/+layout.svelte` and `MarkdownBody.svelte` with `{@html}`.
- Old: `DOMPurify.sanitize` in `main:src/lib/news/markdown/mutations.server.ts`.
- Fix: sanitize with the T03 helper.

### [ ] T24 Admins can't open removed events

- New: `routes/(app)/events/[slug]/+page.ts` never asks for deleted events,
  so links from `/events/all-events` 404.
- Old: holders of `event:delete` could read removed events.
- Fix: pass `includeDeleted: true` when the user has `event:delete` or
  `event:update` (Go's `GetDeleted` already checks), and show a "removed"
  notice.

### [ ] T25 Any article creator can post as any custom author

- New: `ListCustomAuthors` (`queries/custom_authors.sql`) is unfiltered and
  `resolveAuthor` accepts any `customId`.
- Old: `main:src/lib/utils/member.ts` `getCustomAuthorOptions` offered only
  custom authors whose `custom_author_roles` match the member's roles.
- Fix: filter `/custom-authors` by the caller's roles (role match like the
  old code, prefix semantics included) unless they hold
  `news:article:manage`/update, and enforce the same check in
  `resolveAuthor` for create (on edit, keeping the existing custom author is
  allowed).

### [ ] T26 `phadder-role` isn't limited to the current season

- New: `nollning/service.go` ~162-189 returns `members.nollning_group_id`
  regardless of season; the phadder branch takes the oldest mandate.
- Old: only shown when the member's class year is the current year
  (`main:src/routes/(nollning)/nollning/+layout.server.ts`).
- Fix: join `phadder_groups` and filter on the current season; phadder
  mandates newest first within the season window.

### [ ] T27 Season and phadder-group writes answer 500 on bad input

- New: `nollning.Service.CreateSeason`/`UpdateSeason`/`CreateGroup`/
  `UpdateGroup`/`AddNollor` pass input straight to SQL; duplicate year,
  date order, unknown committee/season/group give 500. Overlapping seasons
  are accepted.
- Fix: validate in the service (422 for order/overlap/unknown ids, 409 for
  a duplicate year, 404 for an unknown group).

### [ ] T28 Phadder-group members are readable anonymously

- New: `GET /nollning/phadder-groups/{id}` and
  `GET /members/{studentId}/phadder-role` have no auth check and return
  names, student ids and nicknames.
- Old: members and nicknames needed `core:member:read`; nickname was denied
  to anonymous.
- Fix: require a signed-in member for both (like the member directory).
  Check the nollning pages still load for logged-in users.

### [ ] T29 Editing a song saves display-transformed text

- New: `routes/(app)/songarchive/[slug]/+layout.ts` seeds the edit form from
  `GET /songs/{slug}`, which already applied `FixSongText`; saving
  persists `—`, `–`, `𝄆`, `𝄇` instead of `--`, `|:` etc.
- Fix: add optional `rawTitle`/`rawLyrics` to the song response (only for
  callers who can edit) and seed the form with them.

### [ ] T30 Booking notifications: UTC times and no sender

- New: `notifications/notifier.go` ~114 formats booking times without
  converting to Europe/Stockholm; `NotifyBookingRequestStatus` doesn't set
  `FromMemberID`, so the admin isn't the sender and isn't excluded.
- Fix: `.In(stockholm)` (see `cafe/service.go` for the location) and set
  `FromMemberID` to the reviewing admin.

### [ ] T31 An article's author gets their own NEW_ARTICLE notification

- New: `notifications/service.go` excludes the sender only for
  `FromMemberID`; `NotifyNewArticle` sends with `FromAuthorID`.
- Fix: look up the author's member id and exclude it too.

### [x] T32 Notification settings save isn't transactional

- New: `notifications.Service.PutSettings` deletes then inserts row by row.
- Fix: run it in a transaction.

### [ ] T33 Nollning layout streams and has a stale hardcoded date

- New: `routes/(nollning)/nollning/+layout.server.ts` returns unawaited
  promises (streams every page with status 200, see AGENTS.md gotchas) and
  sets a cookie expiring `2025-10-06`.
- Fix: `await Promise.all(...)`; use the season's `endAt` for the cookie.

## P3: low priority

- [ ] T34 Pass Go's status/detail on instead of fixed 404/500 or thrown
      errors: `news/[slug]/+page.ts`, like action in
      `news/[slug]/+page.server.ts`, `events/EventPageLoad.ts`,
      `events/[slug]/+page.ts` and `edit/+page.ts`,
      `gallery/album/[slug]/+page.ts`, `songarchive/[slug]/+layout.ts`,
      `songbook/+page.ts`, governing-doc and songarchive create/edit
      actions, election create/edit, position page action, info page
      create/update and load, admin access delete/create actions,
      admin/settings actions, booking `saveBookingRequest`,
      `api/notifications/uploadToken` (401 not 500).
- [ ] T35 Escape `\`, `%`, `_` in ILIKE/LIKE search terms (events, songs,
      songbook, `CountSongSlugsWithPrefix`, Salto role prefixes in
      `internal/doors`).
- [ ] T36 Go validation the old zod had: article header min/max lengths,
      notificationText length, YouTube URL; event end > start, non-empty
      titleSv, 255-char limits; mandate end > start, position exists,
      transactional insert, 404 on delete of unknown id; document upload
      year bounds; gallery album name (`isSafePathSegment`) and date
      format; max `pageSize` on `/articles` and `/events`.
- [ ] T37 Mandate order: add `first_name, last_name` after `start_date DESC`
      in `ListMandatesForPosition` / `ListAllMandatesForPosition`.
- [ ] T38 Committee member/mandate counts ignore `?year=`
      (`GetCommitteeByShortName`).
- [ ] T39 Medal endpoints return `null` for empty lists
      (`medals.Service.MemberMedals`, `MedalRecipients`): initialize slices.
- [ ] T40 `/news?tags=<name>` gives 422: map tag names to ids in the load
      or ignore non-UUIDs.
- [ ] T41 Nollning tags show in the public `/events` tag filter: filter by
      the nollning prefix in `EventPageLoad.ts`.
- [ ] T42 Removed events accept RSVPs and comments, removed/unpublished
      articles accept likes and comments: add the removed/published filter
      to `GetEventForAttendance`, `GetEventIDBySlug`,
      `GetArticleIDBySlug` (as used by like/comment).
- [ ] T43 Ticket roster: order by `requested_at` (old order) and build
      `member` whenever the join matched (`ListTicketRoster`,
      `admin/tickets/[releaseId]/loadRoster.ts`).
- [ ] T44 API doc fixes: `TicketQueueEntry.QueuePosition` is 0-based;
      `cancel-ticket-request` doesn't cancel accepted tickets; comment
      operations don't notify mentions; `ArticleInput.PublishedAt` unset
      means now; `ArticleSummary.Body` is markdown.
- [ ] T45 `/admin/minio` needs `requirePolicy(FILES.BUCKET("files").CREATE)`.
- [ ] T46 `/admin/settings` load should accept `admin:settings:read` (or
      `MANAGE_SEASONS`) like the old page.
- [ ] T47 Storage failures in `internal/documents` come back as 422
      (`invalidf`): return plain errors (500).
- [ ] T48 Album detail lists sibling albums with the same prefix: append
      `/` to the prefix in `gallery.Service.GetAlbum`; apply ListAlbums'
      season check there too.
- [ ] T49 `{@html}` delete messages interpolate file names and governing
      document titles (`documents/DeleteFileForm.svelte`,
      `documents/requirements/+page.svelte`,
      `documents/governing/+page.svelte`): escape them.
- [ ] T50 `javascript:` links in markdown render clickable
      (`MarkdownBody.svelte`, `{@html marked(body)}`): drop non-http(s),
      mailto and relative hrefs with a marked hook (pre-existing).
- [ ] T51 `accesspolicies.Service.Delete` and `alerts.Service.Delete` answer
      204 for unknown ids; `alerts.Service.Close` gives 500 for an unknown
      alert; Shlink errors all become 422 (`links/client.go`).
- [ ] T52 Session cookie `Secure` is opt-in via an undocumented
      `AUTH_COOKIE_SECURE`: derive it from `PUBLIC_FRONTEND_URL`'s scheme and
      document it.
- [ ] T53 Push metrics in `apps/web/src/lib/server/metrics.ts` are never
      incremented: remove them.
- [ ] T54 Contact page drops a mandate holder at 00:00 UTC on their last
      day (`contact/+page.ts` compares a date-only string as UTC).
- [ ] T55 Season lookups run on every request (`auth/real.go` calls
      `NollaYear` and `InjectStabenPolicy`, each querying the season):
      compute once per request or cache briefly.
- [ ] T56 Nollning ICS feed falls back to the general feed after the season
      (`api/events_feeds.go`), and `/nollning/messages` and
      `/nollning/events` are empty outside a season: use the latest revealed
      season.
- [ ] T57 `/nollning/events` lists season events before reveal and computes
      week boundaries in the runtime's timezone.
- [ ] T58 The nolla notification feed lost purchase notification types
      (`queries/notifications.sql`): check which types tickets now send and
      include them.
- [ ] T59 Booking review queue runs ~6 queries per pending request
      (`booking.Service.ReviewQueue`).
- [ ] T60 Cafe shifts created by the old app may be stored at 22:00/23:00
      UTC the previous day: check `SELECT DISTINCT date::time FROM
cafe_shifts` on prod and match days with a half-open range if needed.
