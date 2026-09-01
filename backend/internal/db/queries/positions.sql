-- name: ListPositions :many
SELECT id, name_sv, name_en, committee_id, email, active, board_member,
       description_sv, description_en, start_month, end_month
FROM positions
ORDER BY name_sv;

-- name: GetPosition :one
-- Joins the committee (name/shortName), unlike ListPositions/UpdatePosition -
-- the position detail page links/displays the committee without a second
-- request.
SELECT p.id, p.name_sv, p.name_en, p.committee_id, p.email, p.active, p.board_member,
       p.description_sv, p.description_en, p.start_month, p.end_month,
       c.name_sv AS committee_name_sv, c.name_en AS committee_name_en, c.short_name AS committee_short_name
FROM positions p
LEFT JOIN committees c ON c.id = p.committee_id
WHERE p.id = $1;

-- name: UpdatePosition :one
UPDATE positions
SET name_sv = $2, name_en = $3, email = $4, description_sv = $5, description_en = $6,
    active = $7, board_member = $8
WHERE id = $1
RETURNING id, name_sv, name_en, committee_id, email, active, board_member,
          description_sv, description_en, start_month, end_month;
