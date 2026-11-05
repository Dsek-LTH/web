-- Shared column list for the "joined event" shape: event + author (plain
-- member - events have no mandate/custom-author byline, see internal/events
-- doc comments) + comment/going/interested counts. Duplicated across
-- ListEvents/GetEventBySlug/GetEventRowBySlug because sqlc has no
-- macro/fragment support (same situation as articles.sql).

-- name: ListEvents :many
SELECT
    e.id, e.title_sv, e.title_en, e.description_sv, e.description_en, e.link,
    e.location, e.organizer, e.author_id, e.short_description_sv,
    e.short_description_en, e.start_datetime, e.end_datetime, e.slug,
    e.alarm_active, e.removed_at, e."imageUrl", e.is_cancelled,
    e.recurring_parent_id, e.nollning_season_id, e.committee_id,
    c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
    c.short_name AS committee_short_name, c.symbol_url AS committee_symbol_url,
    m.id AS author_member_id, m.student_id AS author_student_id,
    m.first_name AS author_first_name, m.last_name AS author_last_name,
    m.nickname AS author_nickname, m.picture_path AS author_picture_path,
    COALESCE(cm.n, 0)::int AS comment_count,
    COALESCE(go.n, 0)::int AS going_count,
    COALESCE(it.n, 0)::int AS interested_count
FROM events e
JOIN members m ON m.id = e.author_id
LEFT JOIN committees c ON c.id = e.committee_id
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM event_comments WHERE event_id = e.id
) cm ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _event_going WHERE "A" = e.id
) go ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _event_interested WHERE "A" = e.id
) it ON true
WHERE (
    sqlc.arg('include_removed')::bool
    OR e.removed_at IS NULL OR e.removed_at > now()
  )
  -- Every listing is a time window: upcoming (after=now), past
  -- (before=now), or an explicit range (both set, the events page's
  -- week/month views). An event is in the window if any part of it
  -- overlaps, so an ongoing event shows up in both upcoming and past -
  -- same rule as upstream's getEvents (#1198).
  AND (
    sqlc.narg('after')::timestamptz IS NULL
    OR e.end_datetime > sqlc.narg('after')::timestamptz
  )
  AND (
    sqlc.narg('before')::timestamptz IS NULL
    OR e.start_datetime < sqlc.narg('before')::timestamptz
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR e.title_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.title_en ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.short_description_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.short_description_en ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.description_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.description_en ILIKE '%' || sqlc.narg('search')::text || '%'
  )
  AND (
    sqlc.narg('tag_ids')::uuid[] IS NULL
    OR EXISTS (
        SELECT 1 FROM _event_tags t
        WHERE t."A" = e.id AND t."B" = ANY(sqlc.narg('tag_ids')::uuid[])
    )
  )
  AND (
    sqlc.narg('nollning_season_id')::uuid IS NULL
    OR e.nollning_season_id = sqlc.narg('nollning_season_id')::uuid
  )
  -- Nollning content stays out of the general feeds (it has its own
  -- pages), unless asked for or filtered to one season.
  AND (
    sqlc.arg('include_nollning')::bool
    OR sqlc.narg('nollning_season_id')::uuid IS NOT NULL
    OR e.nollning_season_id IS NULL
  )
-- Ordering direction depends on 'descending' (set for past events, which
-- sort most-recent-first; everything else sorts soonest-first). sqlc can't
-- parameterize ORDER BY directly, so both directions are expressed as
-- CASE'd sort keys - exactly one is non-null per row, the other ties
-- (NULL) and is ignored. The descending key is DESC (nulls first), not
-- DESC NULLS LAST, so it's the exact reverse of events_start_datetime_index
-- and Postgres can read the index backwards; start_datetime is NOT NULL,
-- so the nulls placement changes nothing.
ORDER BY
    (CASE WHEN sqlc.arg('descending')::bool THEN e.start_datetime END) DESC,
    (CASE WHEN NOT sqlc.arg('descending')::bool THEN e.start_datetime END) ASC NULLS LAST
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountEvents :one
SELECT count(*) FROM events e
WHERE (
    sqlc.arg('include_removed')::bool
    OR e.removed_at IS NULL OR e.removed_at > now()
  )
  -- Every listing is a time window: upcoming (after=now), past
  -- (before=now), or an explicit range (both set, the events page's
  -- week/month views). An event is in the window if any part of it
  -- overlaps, so an ongoing event shows up in both upcoming and past -
  -- same rule as upstream's getEvents (#1198).
  AND (
    sqlc.narg('after')::timestamptz IS NULL
    OR e.end_datetime > sqlc.narg('after')::timestamptz
  )
  AND (
    sqlc.narg('before')::timestamptz IS NULL
    OR e.start_datetime < sqlc.narg('before')::timestamptz
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR e.title_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.title_en ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.short_description_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.short_description_en ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.description_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR e.description_en ILIKE '%' || sqlc.narg('search')::text || '%'
  )
  AND (
    sqlc.narg('tag_ids')::uuid[] IS NULL
    OR EXISTS (
        SELECT 1 FROM _event_tags t
        WHERE t."A" = e.id AND t."B" = ANY(sqlc.narg('tag_ids')::uuid[])
    )
  )
  AND (
    sqlc.narg('nollning_season_id')::uuid IS NULL
    OR e.nollning_season_id = sqlc.narg('nollning_season_id')::uuid
  )
  -- Nollning content stays out of the general feeds (it has its own
  -- pages), unless asked for or filtered to one season.
  AND (
    sqlc.arg('include_nollning')::bool
    OR sqlc.narg('nollning_season_id')::uuid IS NOT NULL
    OR e.nollning_season_id IS NULL
  );

-- name: GetEventBySlug :one
-- Public lookup: hides soft-removed events, same visibility rule as
-- ListEvents. The old TS getEvent() applied no such filter at all - fixed
-- here rather than replicated.
SELECT
    e.id, e.title_sv, e.title_en, e.description_sv, e.description_en, e.link,
    e.location, e.organizer, e.author_id, e.short_description_sv,
    e.short_description_en, e.start_datetime, e.end_datetime, e.slug,
    e.alarm_active, e.removed_at, e."imageUrl", e.is_cancelled,
    e.recurring_parent_id, e.nollning_season_id, e.committee_id,
    c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
    c.short_name AS committee_short_name, c.symbol_url AS committee_symbol_url,
    m.id AS author_member_id, m.student_id AS author_student_id,
    m.first_name AS author_first_name, m.last_name AS author_last_name,
    m.nickname AS author_nickname, m.picture_path AS author_picture_path,
    COALESCE(cm.n, 0)::int AS comment_count,
    COALESCE(go.n, 0)::int AS going_count,
    COALESCE(it.n, 0)::int AS interested_count
FROM events e
JOIN members m ON m.id = e.author_id
LEFT JOIN committees c ON c.id = e.committee_id
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM event_comments WHERE event_id = e.id
) cm ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _event_going WHERE "A" = e.id
) go ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _event_interested WHERE "A" = e.id
) it ON true
WHERE e.slug = $1
  AND (e.removed_at IS NULL OR e.removed_at > now());

-- name: GetEventRowBySlug :one
-- Unfiltered lookup: no removed_at filter. Used internally after
-- create/update, and by GetAny for callers - like an edit page - that need
-- to load an event regardless of soft-delete status.
SELECT
    e.id, e.title_sv, e.title_en, e.description_sv, e.description_en, e.link,
    e.location, e.organizer, e.author_id, e.short_description_sv,
    e.short_description_en, e.start_datetime, e.end_datetime, e.slug,
    e.alarm_active, e.removed_at, e."imageUrl", e.is_cancelled,
    e.recurring_parent_id, e.nollning_season_id, e.committee_id,
    c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
    c.short_name AS committee_short_name, c.symbol_url AS committee_symbol_url,
    m.id AS author_member_id, m.student_id AS author_student_id,
    m.first_name AS author_first_name, m.last_name AS author_last_name,
    m.nickname AS author_nickname, m.picture_path AS author_picture_path,
    COALESCE(cm.n, 0)::int AS comment_count,
    COALESCE(go.n, 0)::int AS going_count,
    COALESCE(it.n, 0)::int AS interested_count
FROM events e
JOIN members m ON m.id = e.author_id
LEFT JOIN committees c ON c.id = e.committee_id
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM event_comments WHERE event_id = e.id
) cm ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _event_going WHERE "A" = e.id
) go ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _event_interested WHERE "A" = e.id
) it ON true
WHERE e.slug = $1;

-- name: GetEventIDBySlug :one
SELECT id FROM events WHERE slug = $1;

-- name: GetEventForAttendance :one
-- Phase 9: setAttendance needs the organizer/title/slug to notify on
-- going/interested (see integrations.EventNotification), not just the id
-- GetEventIDBySlug returns.
SELECT id, slug, title_sv, author_id FROM events WHERE slug = $1;

-- name: CountEventSlugsWithPrefix :one
SELECT count(*) FROM events WHERE slug LIKE $1 || '%';

-- name: CreateEvent :one
INSERT INTO events (
    title_sv, title_en, description_sv, description_en, link, location,
    organizer, author_id, short_description_sv, short_description_en,
    start_datetime, end_datetime, slug, "imageUrl", alarm_active,
    is_cancelled, recurring_parent_id, nollning_season_id, committee_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
) RETURNING id, slug;

-- name: UpdateEvent :one
-- Full-replace of content fields (same PUT-not-PATCH convention as
-- articles), plus this occurrence's own start/end datetime. author_id is
-- deliberately never reassigned here - see internal/events doc comments on
-- why events diverge from articles' "always re-attribute to the editor"
-- rule.
UPDATE events SET
    title_sv = $2,
    title_en = $3,
    description_sv = $4,
    description_en = $5,
    link = $6,
    location = $7,
    organizer = $8,
    short_description_sv = $9,
    short_description_en = $10,
    start_datetime = $11,
    end_datetime = $12,
    "imageUrl" = $13,
    alarm_active = $14,
    is_cancelled = $15,
    nollning_season_id = $16,
    committee_id = $17
WHERE id = $1
RETURNING id, slug;

-- name: ListEventSiblings :many
-- Every other occurrence in a recurring series, for a FUTURE/ALL edit or
-- delete. min_start_datetime narg'd out entirely (not just NULL) for ALL,
-- set for FUTURE (see internal/events.Service.Update/Delete).
SELECT id, slug, start_datetime, end_datetime
FROM events
WHERE recurring_parent_id = sqlc.arg('recurring_parent_id')
  AND (
    sqlc.narg('min_start_datetime')::timestamptz IS NULL
    OR start_datetime >= sqlc.narg('min_start_datetime')::timestamptz
  )
ORDER BY start_datetime;

-- name: SoftDeleteEvent :exec
UPDATE events SET removed_at = now() WHERE id = $1;

-- name: SoftDeleteEventSeries :exec
-- Powers both FUTURE (min_start_datetime set) and ALL (narg'd out) series
-- deletes in one statement, unlike the per-row loop UpdateEvent needs (a
-- plain removed_at write has no per-row content to vary).
UPDATE events SET removed_at = now()
WHERE recurring_parent_id = sqlc.arg('recurring_parent_id')
  AND (
    sqlc.narg('min_start_datetime')::timestamptz IS NULL
    OR start_datetime >= sqlc.narg('min_start_datetime')::timestamptz
  );

-- name: CreateRecurringEvent :one
INSERT INTO recurring_event (
    separation_count, recurring_type, author_id, start_datetime, end_datetime
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING id;

-- name: GetRecurringEvent :one
SELECT id, separation_count, recurring_type, author_id, start_datetime, end_datetime
FROM recurring_event
WHERE id = $1;

-- name: GetCommitteeNameSv :one
-- Events store the chosen organizing committee's Swedish name in the
-- free-text organizer column too (see Service.resolveCommittee).
SELECT name_sv FROM committees WHERE id = $1;

-- name: ListEventsForCalendar :many
-- The ICS subscribe feeds: non-removed events starting after starts_after
-- (and, if given, ending before ends_before). nollning_season_id narrows
-- to one season's events; exclude_nollning drops every season's events
-- (the general feed - what BASIC_EVENT_FILTER(false) did with tags).
SELECT id, title_sv, title_en, description_sv, description_en, location,
    start_datetime, end_datetime, number_of_updates
FROM events
WHERE (removed_at IS NULL OR removed_at > now())
  AND start_datetime >= sqlc.arg('starts_after')
  AND (sqlc.narg('ends_before')::timestamptz IS NULL OR end_datetime <= sqlc.narg('ends_before')::timestamptz)
  AND (sqlc.narg('nollning_season_id')::uuid IS NULL OR nollning_season_id = sqlc.narg('nollning_season_id')::uuid)
  AND (NOT sqlc.arg('exclude_nollning')::bool OR nollning_season_id IS NULL)
ORDER BY start_datetime;

-- name: AnyAlarmActiveEventNow :one
SELECT EXISTS (
    SELECT 1 FROM events
    WHERE alarm_active AND start_datetime <= now() AND end_datetime > now()
);

-- name: GetEventSlugByID :one
-- Non-removed only, like the event pages themselves.
SELECT id, slug, title_sv FROM events
WHERE id = $1 AND (removed_at IS NULL OR removed_at > now());

-- name: SetEventSlug :exec
UPDATE events SET slug = $2 WHERE id = $1;
