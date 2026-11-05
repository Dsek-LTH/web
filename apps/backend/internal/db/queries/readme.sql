-- name: GetReadmeIssue :one
-- (year, number) isn't unique in the table; the old page took the first
-- match, so this does too, deterministically.
SELECT id, title, url, year, number, published_at
FROM readme
WHERE year = sqlc.arg('year') AND number = sqlc.arg('number')
ORDER BY created_at
LIMIT 1;
