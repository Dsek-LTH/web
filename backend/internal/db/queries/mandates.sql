-- name: ListMandatesForMember :many
-- Full mandate history (not just currently-active, unlike
-- ListActiveMandatesForMember) for a member's profile page, joined to
-- position+committee for display.
SELECT m.id, m.start_date, m.end_date,
       p.id AS position_id, p.name_sv AS position_name_sv, p.name_en AS position_name_en,
       c.id AS committee_id, c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
       c.short_name AS committee_short_name
FROM mandates m
JOIN positions p ON p.id = m.position_id
LEFT JOIN committees c ON c.id = p.committee_id
WHERE m.member_id = $1
ORDER BY m.start_date DESC;

-- name: ListMandatesForPosition :many
-- Year-scoped (overlapping [year-01-01, year-12-31]), joined to member -
-- mirrors the committee detail page's year filter (GET /committees/{shortName}?year=).
SELECT m.id, m.start_date, m.end_date, mem.id AS member_id, mem.student_id,
       mem.first_name, mem.nickname, mem.last_name, mem.picture_path
FROM mandates m
JOIN members mem ON mem.id = m.member_id
WHERE m.position_id = $1
  AND m.start_date <= make_date(sqlc.arg('year')::int, 12, 31)
  AND m.end_date >= make_date(sqlc.arg('year')::int, 1, 1)
ORDER BY m.start_date DESC;

-- name: ListAllMandatesForPosition :many
-- Unscoped (full history, not year-scoped) - the position detail page
-- groups a position's entire mandate history client-side by year for
-- historical study-year statistics, unlike the committee detail page's
-- single-year view. Includes class_year/class_programme for that stats
-- computation and the member's programme badge.
SELECT m.id, m.start_date, m.end_date, mem.id AS member_id, mem.student_id,
       mem.first_name, mem.nickname, mem.last_name, mem.picture_path,
       mem.class_year, mem.class_programme
FROM mandates m
JOIN members mem ON mem.id = m.member_id
WHERE m.position_id = $1
ORDER BY m.start_date DESC;

-- name: CreateMandate :one
INSERT INTO mandates (member_id, position_id, start_date, end_date, last_synced)
VALUES ($1, $2, $3, $4, CURRENT_DATE)
RETURNING id, start_date, end_date;

-- name: UpdateMandate :one
UPDATE mandates
SET start_date = $2, end_date = $3
WHERE id = $1
RETURNING id, start_date, end_date;

-- name: DeleteMandate :exec
DELETE FROM mandates WHERE id = $1;

-- name: ListActiveMandatesForMember :many
-- "Active" mirrors the old TS backend's author-options query: currently
-- within the mandate's start/end date range.
SELECT m.id, p.id AS position_id, p.name_sv AS position_name_sv, p.name_en AS position_name_en
FROM mandates m
JOIN positions p ON p.id = m.position_id
WHERE m.member_id = $1
  AND m.start_date <= CURRENT_DATE
  AND m.end_date >= CURRENT_DATE
ORDER BY p.name_sv;
