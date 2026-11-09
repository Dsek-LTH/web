-- name: ListCustomAuthors :many
-- Every custom author, for those who may post as any of them (see
-- articles.Service.ListCustomAuthors).
SELECT id, name_sv, name_en, image_url FROM custom_authors ORDER BY name_sv;

-- name: ListCustomAuthorsForRoles :many
-- The custom authors one of the given roles may post as: those with a
-- custom_author_roles row naming one of them. Roles are the caller's
-- derived roles (auth.DerivedRoles), so a row for "dsek.infu" matches
-- everyone in "dsek.infu.mdlm", like the old TS getCustomAuthorOptions.
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
