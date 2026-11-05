-- name: ListCustomAuthors :many
-- Unfiltered: every member can choose from every custom author. The old
-- TS backend restricted this list to custom authors whose
-- custom_author_roles matched one of the member's roles; that filter isn't
-- ported.
SELECT id, name_sv, name_en, image_url FROM custom_authors ORDER BY name_sv;
