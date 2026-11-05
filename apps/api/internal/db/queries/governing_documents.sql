-- name: ListGoverningDocuments :many
SELECT id, title, url, type, created_at, updated_at, deleted_at
FROM documents
WHERE deleted_at IS NULL
ORDER BY title ASC;

-- name: GetGoverningDocumentByID :one
-- Constrained to POLICY/GUIDELINE, matching the old app's edit-lookup
-- query - the other enum values have no create/edit UI anywhere.
SELECT id, title, url, type, created_at, updated_at, deleted_at
FROM documents
WHERE id = $1 AND deleted_at IS NULL AND type IN ('POLICY', 'GUIDELINE');

-- name: GetAnyGoverningDocumentByID :one
-- Unconstrained by type, unlike GetGoverningDocumentByID above - the list
-- page's delete action operates on any document by id regardless of type
-- (MEETING/OTHER/etc. included), matching the old app's
-- prisma.document.delete({where:{id}}) exactly.
SELECT id, title, url, type, created_at, updated_at, deleted_at
FROM documents
WHERE id = $1 AND deleted_at IS NULL;

-- name: CreateGoverningDocument :one
INSERT INTO documents (title, url, type)
VALUES ($1, $2, $3)
RETURNING id, title, url, type, created_at, updated_at, deleted_at;

-- name: UpdateGoverningDocument :one
UPDATE documents
SET title = $2, url = $3, type = $4, updated_at = now()
WHERE id = $1
RETURNING id, title, url, type, created_at, updated_at, deleted_at;

-- name: SoftDeleteGoverningDocument :exec
UPDATE documents SET deleted_at = now() WHERE id = $1;
