-- name: ListOpenElections :many
-- Only elections that haven't expired yet, soonest-closing first - matches
-- the old /elections page's prisma.election.findMany({where: {expiresAt:
-- {gte: now()}}, orderBy: [{expiresAt: "asc"}]}) exactly. Joins the small
-- slice of committees columns the election card actually renders (icon +
-- name), same fields the old page's committee `select` projected.
SELECT
    e.id, e.committee_id, e.markdown_sv, e.markdown_en, e.link, e.created_at, e.expires_at,
    c.name_sv AS committee_name_sv,
    c.name_en AS committee_name_en,
    c.dark_image_url AS committee_dark_image_url,
    c.light_image_url AS committee_light_image_url,
    c.mono_image_url AS committee_mono_image_url
FROM elections e
JOIN committees c ON c.id = e.committee_id
WHERE e.expires_at >= now()
ORDER BY e.expires_at ASC;

-- name: GetElectionByID :one
-- Unconstrained by expiry (unlike ListOpenElections) - the edit page looks
-- up an election by id regardless of whether it has already expired,
-- matching prisma.election.findFirst({where: {id}}).
SELECT
    e.id, e.committee_id, e.markdown_sv, e.markdown_en, e.link, e.created_at, e.expires_at,
    c.name_sv AS committee_name_sv,
    c.name_en AS committee_name_en,
    c.dark_image_url AS committee_dark_image_url,
    c.light_image_url AS committee_light_image_url,
    c.mono_image_url AS committee_mono_image_url
FROM elections e
JOIN committees c ON c.id = e.committee_id
WHERE e.id = sqlc.arg(id);

-- name: CreateElection :one
INSERT INTO elections (committee_id, markdown_sv, markdown_en, link, expires_at)
VALUES (sqlc.arg(committee_id), sqlc.arg(markdown_sv), sqlc.arg(markdown_en), sqlc.arg(link), sqlc.arg(expires_at))
RETURNING id, committee_id, markdown_sv, markdown_en, link, created_at, expires_at;

-- name: UpdateElection :one
UPDATE elections
SET committee_id = sqlc.arg(committee_id),
    markdown_sv  = sqlc.arg(markdown_sv),
    markdown_en  = sqlc.arg(markdown_en),
    link         = sqlc.arg(link),
    expires_at   = sqlc.arg(expires_at)
WHERE id = sqlc.arg(id)
RETURNING id, committee_id, markdown_sv, markdown_en, link, created_at, expires_at;

-- name: DeleteElection :execrows
-- Hard delete - the elections table has no removed_at/deleted_at column at
-- all, unlike Song/Article/GoverningDocument.
DELETE FROM elections WHERE id = sqlc.arg(id);
