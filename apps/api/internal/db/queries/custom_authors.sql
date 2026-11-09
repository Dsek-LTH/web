-- name: ListCustomAuthors :many
-- Every custom author, for those who may post as any of them (see
-- articles.Service.ListCustomAuthors).
SELECT id, name_sv, name_en, image_url FROM custom_authors ORDER BY name_sv;

-- name: ListCustomAuthorsForRoles :many
-- The custom authors one of the given roles may post as: those with a
-- custom_author_roles row naming one of them. The roles are built by
-- articles.Service.customAuthorRoles: the ids of the positions the caller
-- holds a mandate for today, each expanded to its dot-separated prefixes,
-- plus "*" and "_" (like the old TS getCustomAuthorOptions), together with
-- the identity's own derived roles. So a row for "dsek.infu" matches
-- everyone in "dsek.infu.mdlm".
SELECT ca.id, ca.name_sv, ca.name_en, ca.image_url
FROM custom_authors ca
WHERE EXISTS (
    SELECT 1 FROM custom_author_roles car
    WHERE car.custom_author_id = ca.id
      AND car.role = ANY(sqlc.arg('roles')::text[])
)
ORDER BY ca.name_sv;

-- name: CustomAuthorAllowedForRoles :one
-- Whether one of the given roles may post as the custom author; see
-- ListCustomAuthorsForRoles.
SELECT EXISTS (
    SELECT 1 FROM custom_author_roles
    WHERE custom_author_id = sqlc.arg('custom_author_id')::uuid
      AND role = ANY(sqlc.arg('roles')::text[])
);

-- name: ListActivePositionIDsForMember :many
-- The positions the member holds a mandate for today, for the custom
-- author roles (see ListCustomAuthorsForRoles).
SELECT DISTINCT position_id FROM mandates
WHERE member_id = sqlc.arg('member_id')::uuid
  AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;
