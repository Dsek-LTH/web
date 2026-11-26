-- name: ListPositions :many
-- Joins the committee (name/shortName) like GetPosition, so GET /positions
-- can group positions by committee.
SELECT p.id, p.name_sv, p.name_en, p.committee_id, p.email, p.active, p.board_member,
       p.description_sv, p.description_en, p.start_month, p.end_month,
       p.long_description_sv, p.long_description_en,
       c.name_sv AS committee_name_sv, c.name_en AS committee_name_en, c.short_name AS committee_short_name
FROM positions p
LEFT JOIN committees c ON c.id = p.committee_id
ORDER BY p.name_sv;

-- name: GetPosition :one
-- Joins the committee (name/shortName), unlike UpdatePosition -
-- the position detail page links/displays the committee without a second
-- request.
SELECT p.id, p.name_sv, p.name_en, p.committee_id, p.email, p.active, p.board_member,
       p.description_sv, p.description_en, p.start_month, p.end_month,
       p.long_description_sv, p.long_description_en,
       c.name_sv AS committee_name_sv, c.name_en AS committee_name_en, c.short_name AS committee_short_name
FROM positions p
LEFT JOIN committees c ON c.id = p.committee_id
WHERE p.id = $1;

-- name: ListBoard :many
-- Board positions (board_member=true, active=true) with their current
-- holder, one row per position (LEFT JOIN LATERAL picks at most the most
-- recently-started active mandate; NULL member fields mean vacant) - backs
-- GET /board. Staben redaction (hiding organizing-committee positions from
-- viewers without MemberSeeStaben) happens in committees.Service.ListBoard,
-- not here - this query returns the unredacted set.
SELECT p.id, p.name_sv, p.name_en, p.committee_id, p.email, p.active, p.board_member,
       p.description_sv, p.description_en, p.start_month, p.end_month,
       mem.id AS member_id, mem.student_id, mem.first_name, mem.nickname,
       mem.last_name, mem.picture_path, mem.class_year, mem.class_programme
FROM positions p
LEFT JOIN LATERAL (
    SELECT m.member_id
    FROM mandates m
    WHERE m.position_id = p.id
      AND m.start_date <= CURRENT_DATE AND m.end_date >= CURRENT_DATE
    ORDER BY m.start_date DESC
    LIMIT 1
) active_mandate ON true
LEFT JOIN members mem ON mem.id = active_mandate.member_id
WHERE p.board_member = true AND p.active = true
ORDER BY p.id;

-- name: UpdatePosition :one
UPDATE positions
SET name_sv = sqlc.arg('name_sv'), name_en = sqlc.arg('name_en'), email = sqlc.arg('email'),
    description_sv = sqlc.arg('description_sv'), description_en = sqlc.arg('description_en'),
    long_description_sv = sqlc.arg('long_description_sv'),
    long_description_en = sqlc.arg('long_description_en'),
    active = sqlc.arg('active'), board_member = sqlc.arg('board_member')
WHERE id = sqlc.arg('id')
RETURNING id, name_sv, name_en, committee_id, email, active, board_member,
          description_sv, description_en, start_month, end_month,
          long_description_sv, long_description_en;
