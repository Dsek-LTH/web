-- name: ListTags :many
SELECT id, name_sv, name_en, color, is_default FROM tags ORDER BY name_sv;

-- name: ListTagsForArticles :many
SELECT t."A" AS article_id, tags.id, tags.name_sv, tags.name_en, tags.color, tags.is_default
FROM _article_tags t
JOIN tags ON tags.id = t."B"
WHERE t."A" = ANY($1::uuid[])
ORDER BY tags.name_sv;

-- name: ClearArticleTags :exec
DELETE FROM _article_tags WHERE "A" = sqlc.arg('article_id');

-- name: AddArticleTags :exec
INSERT INTO _article_tags ("A", "B")
SELECT sqlc.arg('article_id'), unnest(sqlc.arg('tag_ids')::uuid[])
ON CONFLICT ("A", "B") DO NOTHING;
