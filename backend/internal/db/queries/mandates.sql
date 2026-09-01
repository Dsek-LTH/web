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
