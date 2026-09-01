-- name: ListTagsForEvents :many
SELECT t."A" AS event_id, tags.id, tags.name_sv, tags.name_en, tags.color, tags.is_default
FROM _event_tags t
JOIN tags ON tags.id = t."B"
WHERE t."A" = ANY($1::uuid[])
ORDER BY tags.name_sv;

-- name: ClearEventTags :exec
DELETE FROM _event_tags WHERE "A" = sqlc.arg('event_id');

-- name: AddEventTags :exec
INSERT INTO _event_tags ("A", "B")
SELECT sqlc.arg('event_id'), unnest(sqlc.arg('tag_ids')::uuid[])
ON CONFLICT ("A", "B") DO NOTHING;
