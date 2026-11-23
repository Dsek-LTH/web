-- name: ListBookableCategories :many
SELECT id, name_sv, name_en FROM bookable_categories ORDER BY name_sv;

-- name: GetBookableCategoryByID :one
SELECT id, name_sv, name_en FROM bookable_categories WHERE id = $1;

-- name: CreateBookableCategory :one
INSERT INTO bookable_categories (name_sv, name_en)
VALUES ($1, $2)
RETURNING id, name_sv, name_en;

-- name: UpdateBookableCategory :one
UPDATE bookable_categories SET name_sv = $2, name_en = $3
WHERE id = $1
RETURNING id, name_sv, name_en;

-- name: ListBookables :many
SELECT b.id, b.name_sv, b.name_en, b."isDisabled", b.door, b.category_id,
       c.id AS category_id_joined, c.name_sv AS category_name_sv, c.name_en AS category_name_en
FROM bookables b
LEFT JOIN bookable_categories c ON c.id = b.category_id
ORDER BY b.name_sv;

-- name: GetBookableByID :one
SELECT b.id, b.name_sv, b.name_en, b."isDisabled", b.door, b.category_id,
       c.id AS category_id_joined, c.name_sv AS category_name_sv, c.name_en AS category_name_en
FROM bookables b
LEFT JOIN bookable_categories c ON c.id = b.category_id
WHERE b.id = $1;

-- name: CreateBookable :one
INSERT INTO bookables (name_sv, name_en, "isDisabled", door, category_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name_sv, name_en, "isDisabled", door, category_id;

-- name: UpdateBookable :one
UPDATE bookables
SET name_sv = $2, name_en = $3, "isDisabled" = $4, door = $5, category_id = $6
WHERE id = $1
RETURNING id, name_sv, name_en, "isDisabled", door, category_id;

-- name: ListUpcomingBookingRequests :many
-- Mirrors the old app's getUpcomingBookingRequests: every request starting
-- on or after `since` (callers pass now-1week, matching the old hardcoded
-- window), regardless of booker - visibility is gated at the service layer
-- (booking_request:read), not per-row ownership.
SELECT br.id, br.booker_id, br.start, br."end", br.created, br.event, br.status,
       m.id AS booker_member_id, m.student_id AS booker_student_id,
       m.first_name AS booker_first_name, m.last_name AS booker_last_name,
       m.nickname AS booker_nickname, m.picture_path AS booker_picture_path
FROM booking_requests br
LEFT JOIN members m ON m.id = br.booker_id
WHERE br.start >= sqlc.arg('since')
ORDER BY br.start ASC NULLS LAST, br."end" ASC NULLS LAST, br.status ASC;

-- name: GetBookingRequestByID :one
SELECT br.id, br.booker_id, br.start, br."end", br.created, br.event, br.status,
       m.id AS booker_member_id, m.student_id AS booker_student_id,
       m.first_name AS booker_first_name, m.last_name AS booker_last_name,
       m.nickname AS booker_nickname, m.picture_path AS booker_picture_path
FROM booking_requests br
LEFT JOIN members m ON m.id = br.booker_id
WHERE br.id = $1;

-- name: CreateBookingRequest :one
INSERT INTO booking_requests (booker_id, start, "end", event, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, booker_id, start, "end", created, event, status;

-- name: UpdateBookingRequest :one
-- Full-replace of the editable fields, same PUT-dressed-as-PATCH
-- convention as articles/events/songs. Status is passed through explicitly
-- rather than left untouched - the service decides whether to reset it to
-- PENDING (non-admin edit) or keep the caller-supplied value (admin edit),
-- mirroring the old app's isAdmin branch exactly.
UPDATE booking_requests
SET start = $2, "end" = $3, event = $4, status = $5
WHERE id = $1
RETURNING id, booker_id, start, "end", created, event, status;

-- name: UpdateBookingRequestStatus :one
UPDATE booking_requests SET status = $2
WHERE id = $1
RETURNING id, booker_id, start, "end", created, event, status;

-- name: LockBookingRequest :one
-- Locks the request row for the rest of the transaction, so concurrent
-- edits and accept/reject of one request run one after another.
SELECT id, booker_id, status FROM booking_requests WHERE id = $1 FOR UPDATE;

-- name: DeleteBookingRequest :exec
DELETE FROM booking_requests WHERE id = $1;

-- name: ListBookablesForBookingRequests :many
SELECT link."B" AS booking_request_id, b.id, b.name_sv, b.name_en, b."isDisabled", b.door, b.category_id
FROM _booking_requests_bookables link
JOIN bookables b ON b.id = link."A"
WHERE link."B" = ANY(sqlc.arg('booking_request_ids')::uuid[])
ORDER BY b.name_sv;

-- name: ClearBookingRequestBookables :exec
DELETE FROM _booking_requests_bookables WHERE "B" = sqlc.arg('booking_request_id');

-- name: AddBookingRequestBookables :exec
INSERT INTO _booking_requests_bookables ("A", "B")
SELECT unnest(sqlc.arg('bookable_ids')::uuid[]), sqlc.arg('booking_request_id')
ON CONFLICT DO NOTHING;

-- name: ListConflictingBookingRequests :many
-- Non-blocking overlap warning - the old app never checked this at all; Go surfaces it
-- as a warning on create/update rather than rejecting the request outright.
-- DENIED requests never conflict; exclude_id lets an edit ignore its own
-- pre-existing row (NULL/unset on create, where nothing to exclude yet).
SELECT DISTINCT br.id, br.booker_id, br.start, br."end", br.created, br.event, br.status,
       m.id AS booker_member_id, m.student_id AS booker_student_id,
       m.first_name AS booker_first_name, m.last_name AS booker_last_name,
       m.nickname AS booker_nickname, m.picture_path AS booker_picture_path
FROM booking_requests br
LEFT JOIN members m ON m.id = br.booker_id
JOIN _booking_requests_bookables link ON link."B" = br.id
WHERE link."A" = ANY(sqlc.arg('bookable_ids')::uuid[])
  AND br.status != 'DENIED'
  AND (sqlc.narg('exclude_id')::uuid IS NULL OR br.id != sqlc.narg('exclude_id')::uuid)
  AND br.start IS NOT NULL AND br."end" IS NOT NULL
  AND br.start < sqlc.arg('end_at') AND br."end" > sqlc.arg('start_at')
ORDER BY br.start;

-- name: GetCurrentKarhusmastare :one
-- The building-manager position holder, notified on every new booking
-- request - a hardcoded position slug in the old app too (dsek.km.mastare),
-- not configurable.
SELECT m.id, m.student_id, m.first_name, m.last_name, m.nickname, m.picture_path
FROM mandates ma
JOIN members m ON m.id = ma.member_id
WHERE ma.position_id = 'dsek.km.mastare'
  AND ma.start_date <= CURRENT_DATE AND ma.end_date >= CURRENT_DATE
ORDER BY ma.start_date DESC
LIMIT 1;

-- name: ListAccessDoorsForBookingRequests :many
SELECT a."A" AS booking_request_id, d.name, d.verbose_name
FROM _booking_requests_access_doors a
JOIN doors d ON d.name = a."B"
WHERE a."A" = ANY(sqlc.arg(ids)::uuid[])
ORDER BY d.verbose_name;

-- name: ListAccessMembersForBookingRequests :many
SELECT a."A" AS booking_request_id, m.id, m.student_id, m.first_name,
       m.last_name, m.nickname, m.picture_path, m.class_year, m.class_programme
FROM _booking_requests_access_members a
JOIN members m ON m.id = a."B"
WHERE a."A" = ANY(sqlc.arg(ids)::uuid[])
ORDER BY m.first_name, m.last_name;

-- name: ClearBookingRequestAccessDoors :exec
DELETE FROM _booking_requests_access_doors WHERE "A" = $1;

-- name: ClearBookingRequestAccessMembers :exec
DELETE FROM _booking_requests_access_members WHERE "A" = $1;

-- name: AddBookingRequestAccessDoors :exec
INSERT INTO _booking_requests_access_doors ("A", "B")
SELECT sqlc.arg(id), unnest(sqlc.arg(door_names)::text[]);

-- name: AddBookingRequestAccessMembers :exec
INSERT INTO _booking_requests_access_members ("A", "B")
SELECT sqlc.arg(id), unnest(sqlc.arg(member_ids)::uuid[]);

-- name: CountDoorsByName :one
SELECT count(*) FROM doors WHERE name = ANY(sqlc.arg(names)::text[]);

-- name: CountBookablesByID :one
SELECT count(*) FROM bookables WHERE id = ANY(sqlc.arg(ids)::uuid[]);

-- name: CountMembersByID :one
SELECT count(*) FROM members WHERE id = ANY(sqlc.arg(ids)::uuid[]);

-- name: ClearBookingDoorAccess :exec
DELETE FROM door_access_policies WHERE booking_request_id = $1;

-- name: GrantBookingDoorAccess :exec
-- One door policy per (requested door x requested member with a student
-- id), for the booking's window widened by `buffer` on both sides.
INSERT INTO door_access_policies (
    door_name, student_id, start_datetime, end_datetime, information,
    booking_request_id
)
SELECT d."B", m.student_id, b.start - sqlc.arg(buffer)::interval,
       b."end" + sqlc.arg(buffer)::interval,
       left('Booking: ' || COALESCE(b.event, b.id::text), 255), b.id
FROM booking_requests b
JOIN _booking_requests_access_doors d ON d."A" = b.id
JOIN _booking_requests_access_members a ON a."A" = b.id
JOIN members m ON m.id = a."B"
WHERE b.id = sqlc.arg(id)
  AND b.start IS NOT NULL AND b."end" IS NOT NULL
  AND m.student_id IS NOT NULL;

-- name: ListPendingBookingRequests :many
-- The review queue: pending requests that haven't ended yet.
SELECT br.id, br.booker_id, br.start, br."end", br.created, br.event, br.status,
       m.id AS booker_member_id, m.student_id AS booker_student_id,
       m.first_name AS booker_first_name, m.last_name AS booker_last_name,
       m.nickname AS booker_nickname, m.picture_path AS booker_picture_path
FROM booking_requests br
LEFT JOIN members m ON m.id = br.booker_id
WHERE br.status = 'PENDING' AND br.start IS NOT NULL AND br."end" >= now()
ORDER BY br.start, br."end";

-- name: ListDoorsForBooking :many
SELECT name, verbose_name FROM doors ORDER BY verbose_name;
