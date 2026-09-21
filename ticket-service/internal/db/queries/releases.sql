-- name: CreateRelease :one
INSERT INTO ticket_release (
    event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
RETURNING id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at;

-- name: GetRelease :one
-- Not filtered by expires_at - old releases are kept in the database (not
-- purged) and stay reachable directly, e.g. for an admin reviewing a past
-- event's attendee list. They're just excluded from the listings below.
SELECT id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at
FROM ticket_release
WHERE id = $1;

-- name: ListReleases :many
-- The public/browsing listing - expired releases (event over) are excluded.
SELECT id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at
FROM ticket_release
WHERE expires_at > now()
ORDER BY opens_at DESC;

-- name: ListAllReleases :many
-- The admin listing - nothing excluded, so past events stay reviewable.
SELECT id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at
FROM ticket_release
ORDER BY opens_at DESC;

-- name: LockRelease :one
SELECT id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at
FROM ticket_release
WHERE id = $1
FOR UPDATE;

-- name: SetReleaseStatus :exec
UPDATE ticket_release SET status = $2 WHERE id = $1;

-- name: GetReleaseCounts :one
SELECT
    r.quantity::int AS quantity,
    count(*) FILTER (WHERE q.status IN ('granted', 'accepted'))::int AS claimed,
    count(*) FILTER (WHERE q.status = 'waitlisted')::int AS waitlisted
FROM ticket_release r
LEFT JOIN ticket_queue_entry q ON q.release_id = r.id
WHERE r.id = $1
GROUP BY r.quantity;

-- name: InsertQueueEntry :one
-- Idempotent: a repeat request for the same (release, member) just returns
-- the existing row unchanged instead of erroring.
INSERT INTO ticket_queue_entry (release_id, member_id, status)
VALUES ($1, $2, 'pending')
ON CONFLICT (release_id, member_id) DO UPDATE SET member_id = EXCLUDED.member_id
RETURNING id, release_id, member_id, status, queue_position, offer_expires_at, requested_at, updated_at;

-- name: GetQueueEntry :one
SELECT id, release_id, member_id, status, queue_position, offer_expires_at, requested_at, updated_at
FROM ticket_queue_entry
WHERE release_id = $1 AND member_id = $2;

-- name: ListEntriesForMember :many
-- A member's "my tickets" view - expired releases (event over) are excluded
-- so old tickets don't build up indefinitely.
SELECT
    e.id, e.release_id, e.member_id, e.status, e.queue_position, e.offer_expires_at, e.requested_at, e.updated_at,
    r.title AS release_title
FROM ticket_queue_entry e
JOIN ticket_release r ON r.id = e.release_id
WHERE e.member_id = $1 AND r.expires_at > now()
ORDER BY e.requested_at DESC;

-- name: ListAcceptedEntriesForRelease :many
-- The admin roster for one release - only entries that actually hold a
-- confirmed ticket (pending/waitlisted/granted/expired/cancelled are noise
-- for "who has a ticket" purposes, and their status would always read the
-- same anyway).
SELECT id, release_id, member_id, status, queue_position, offer_expires_at, requested_at, updated_at
FROM ticket_queue_entry
WHERE release_id = $1 AND status = 'accepted'
ORDER BY requested_at ASC;

-- name: UpdateRelease :one
UPDATE ticket_release
SET title = $2, description = $3, location = $4, quantity = $5, closes_at = $6
WHERE id = $1
RETURNING id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at;

-- name: CountGrantedOrAccepted :one
SELECT count(*) FROM ticket_queue_entry
WHERE release_id = $1 AND status IN ('granted', 'accepted');

-- name: CountWaitlisted :one
SELECT count(*) FROM ticket_queue_entry
WHERE release_id = $1 AND status = 'waitlisted';

-- name: ListPendingForUpdate :many
SELECT id, release_id, member_id, status, queue_position, offer_expires_at, requested_at, updated_at
FROM ticket_queue_entry
WHERE release_id = $1 AND status = 'pending'
FOR UPDATE;

-- name: GrantEntry :exec
UPDATE ticket_queue_entry
SET status = 'granted', queue_position = NULL, offer_expires_at = $3, updated_at = now()
WHERE id = $1 AND release_id = $2;

-- name: WaitlistEntry :exec
UPDATE ticket_queue_entry
SET status = 'waitlisted', queue_position = $3, offer_expires_at = NULL, updated_at = now()
WHERE id = $1 AND release_id = $2;

-- name: AcceptEntry :execrows
UPDATE ticket_queue_entry
SET status = 'accepted', updated_at = now()
WHERE release_id = $1 AND member_id = $2 AND status = 'granted' AND offer_expires_at > now();

-- name: CancelEntry :execrows
UPDATE ticket_queue_entry
SET status = 'cancelled', updated_at = now()
WHERE release_id = $1 AND member_id = $2 AND status IN ('pending', 'granted', 'waitlisted');

-- name: ListExpiredGrantedForUpdate :many
SELECT id, release_id, member_id, status, queue_position, offer_expires_at, requested_at, updated_at
FROM ticket_queue_entry
WHERE release_id = $1 AND status = 'granted' AND offer_expires_at <= now()
FOR UPDATE;

-- name: ExpireEntry :exec
UPDATE ticket_queue_entry SET status = 'expired', updated_at = now() WHERE id = $1;

-- name: ListWaitlistFrontForUpdate :many
SELECT id, release_id, member_id, status, queue_position, offer_expires_at, requested_at, updated_at
FROM ticket_queue_entry
WHERE release_id = $1 AND status = 'waitlisted'
ORDER BY queue_position ASC
LIMIT $2
FOR UPDATE;

-- name: DecrementWaitlistPositions :exec
UPDATE ticket_queue_entry
SET queue_position = queue_position - $2, updated_at = now()
WHERE release_id = $1 AND status = 'waitlisted';

-- name: ListScheduledReleases :many
-- Releases whose lottery hasn't run yet, used to re-arm in-process timers
-- after a restart.
SELECT id, event_id, title, description, location, quantity, opens_at, closes_at, expires_at, grace_window_seconds, offer_window_seconds, status, created_by, created_at
FROM ticket_release
WHERE status = 'scheduled';

-- name: ListReleasesWithActiveOffers :many
-- Releases that have at least one granted-but-unaccepted offer, used to
-- know which releases need an expiry sweep.
SELECT DISTINCT r.id, r.event_id, r.title, r.description, r.location, r.quantity, r.opens_at, r.closes_at, r.expires_at, r.grace_window_seconds, r.offer_window_seconds, r.status, r.created_by, r.created_at
FROM ticket_release r
JOIN ticket_queue_entry q ON q.release_id = r.id
WHERE q.status = 'granted';
