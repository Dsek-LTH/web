-- name: ListPositions :many
SELECT id, name_sv, name_en, committee_id, email, active, board_member,
       description_sv, description_en, start_month, end_month
FROM positions
ORDER BY name_sv;

-- name: GetPosition :one
SELECT id, name_sv, name_en, committee_id, email, active, board_member,
       description_sv, description_en, start_month, end_month
FROM positions
WHERE id = $1;

-- name: UpdatePosition :one
UPDATE positions
SET name_sv = $2, name_en = $3, email = $4, description_sv = $5, description_en = $6,
    active = $7, board_member = $8
WHERE id = $1
RETURNING id, name_sv, name_en, committee_id, email, active, board_member,
          description_sv, description_en, start_month, end_month;
