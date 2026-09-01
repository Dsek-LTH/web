-- name: ListCommittees :many
SELECT id, name_sv, name_en, short_name, symbol_url FROM committees
WHERE sqlc.narg('short_name')::text IS NULL OR short_name = sqlc.narg('short_name')::text
ORDER BY name_sv;
