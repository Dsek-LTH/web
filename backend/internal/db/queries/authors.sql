-- name: FindAuthor :one
-- Authors are reused across articles: an author row is the (member,
-- mandate, custom-author) triple, so the same byline is only created once.
SELECT id FROM authors
WHERE member_id = $1
  AND mandate_id IS NOT DISTINCT FROM sqlc.narg('mandate_id')::uuid
  AND custom_id IS NOT DISTINCT FROM sqlc.narg('custom_id')::uuid
LIMIT 1;

-- name: CreateAuthor :one
INSERT INTO authors (member_id, mandate_id, custom_id)
VALUES ($1, sqlc.narg('mandate_id')::uuid, sqlc.narg('custom_id')::uuid)
RETURNING id;

-- name: GetMandateMemberID :one
-- Used to verify a caller posting "as" a mandate actually holds it.
-- custom_authors has no owner column in the schema (they're shared
-- personas, e.g. "Styrelsen"), so there's no equivalent check for those.
SELECT member_id FROM mandates WHERE id = $1;
