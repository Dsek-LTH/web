-- name: ListCustomAuthors :many
-- Unfiltered: the old TS backend restricted this list to custom authors
-- whose custom_author_roles matched one of the member's Keycloak-derived
-- roles (getDerivedRoles) - that role-derivation system isn't ported to Go
-- (see ../../DESIGN.md's Auth section on the mock RBAC gap), so for now
-- every member can choose from every custom author. Revisit once real
-- roles exist.
SELECT id, name_sv, name_en, image_url FROM custom_authors ORDER BY name_sv;
