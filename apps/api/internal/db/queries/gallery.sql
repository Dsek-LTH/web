-- name: ListAlbums :many
SELECT id, title, description, date, slug
FROM albums
ORDER BY date DESC, created_at DESC;

-- name: GetAlbumBySlug :one
SELECT id, title, description, date, slug
FROM albums
WHERE slug = sqlc.arg('slug');

-- name: AlbumSlugTaken :one
-- Whether another album (not exclude_id, which may be NULL) has the slug.
SELECT EXISTS (
    SELECT 1 FROM albums
    WHERE slug = sqlc.arg('slug')
      AND id IS DISTINCT FROM sqlc.narg('exclude_id')::uuid
);

-- name: CreateAlbum :exec
INSERT INTO albums (id, title, description, date, slug, updated_at)
VALUES (
    sqlc.arg('id'), sqlc.arg('title'), sqlc.narg('description'), sqlc.arg('date'),
    sqlc.arg('slug'), now()
);

-- name: UpdateAlbum :execrows
UPDATE albums
SET title = sqlc.arg('title'), description = sqlc.narg('description'),
    date = sqlc.arg('date'), slug = sqlc.arg('slug'), updated_at = now()
WHERE id = sqlc.arg('id');

-- name: DeleteAlbum :exec
DELETE FROM albums WHERE id = sqlc.arg('id');

-- name: ListAlbumMembers :many
-- The photographers and editors of the given albums, by name.
SELECT r.album_id, r.role::text AS role, m.id, m.student_id, m.first_name,
       m.last_name, m.nickname, m.picture_path, m.class_year, m.class_programme
FROM (
    SELECT "A" AS album_id, "B" AS member_id, 'photographer' AS role
    FROM "_album_photographer"
    WHERE "A" = ANY(sqlc.arg('album_ids')::uuid[])
    UNION ALL
    SELECT "A", "B", 'editor'
    FROM "_album_editor"
    WHERE "A" = ANY(sqlc.arg('album_ids')::uuid[])
) r
JOIN members m ON m.id = r.member_id
ORDER BY m.first_name, m.last_name;

-- name: ClearAlbumPhotographers :exec
DELETE FROM "_album_photographer" WHERE "A" = sqlc.arg('album_id');

-- name: ClearAlbumEditors :exec
DELETE FROM "_album_editor" WHERE "A" = sqlc.arg('album_id');

-- name: AddAlbumPhotographers :exec
INSERT INTO "_album_photographer" ("A", "B")
SELECT sqlc.arg('album_id'), unnest(sqlc.arg('member_ids')::uuid[])
ON CONFLICT DO NOTHING;

-- name: AddAlbumEditors :exec
INSERT INTO "_album_editor" ("A", "B")
SELECT sqlc.arg('album_id'), unnest(sqlc.arg('member_ids')::uuid[])
ON CONFLICT DO NOTHING;
