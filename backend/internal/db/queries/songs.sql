-- name: ListSongs :many
-- show_deleted toggles between two mutually exclusive views (mirroring the
-- old app's "show-deleted" query param on the songbook list page): the
-- normal active-songs list (false/unset) or the trash view of only
-- soft-deleted songs (true) - never both at once, unlike GetSongBySlug's
-- include_deleted below, which unions.
SELECT id, title, lyrics, melody, category, created_at, updated_at, deleted_at, slug, video
FROM songs
WHERE (
    CASE WHEN sqlc.narg('show_deleted')::bool IS TRUE THEN deleted_at IS NOT NULL ELSE deleted_at IS NULL END
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR title ILIKE '%' || sqlc.narg('search')::text || '%'
    OR lyrics ILIKE '%' || sqlc.narg('search')::text || '%'
    OR melody ILIKE '%' || sqlc.narg('search')::text || '%'
  )
  AND (
    sqlc.narg('categories')::text[] IS NULL
    OR EXISTS (
        SELECT 1 FROM unnest(sqlc.narg('categories')::text[]) c
        WHERE category ILIKE '%' || c || '%'
    )
  )
ORDER BY title ASC
LIMIT $1 OFFSET $2;

-- name: CountSongs :one
SELECT count(*) FROM songs
WHERE (
    CASE WHEN sqlc.narg('show_deleted')::bool IS TRUE THEN deleted_at IS NOT NULL ELSE deleted_at IS NULL END
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR title ILIKE '%' || sqlc.narg('search')::text || '%'
    OR lyrics ILIKE '%' || sqlc.narg('search')::text || '%'
    OR melody ILIKE '%' || sqlc.narg('search')::text || '%'
  )
  AND (
    sqlc.narg('categories')::text[] IS NULL
    OR EXISTS (
        SELECT 1 FROM unnest(sqlc.narg('categories')::text[]) c
        WHERE category ILIKE '%' || c || '%'
    )
  );

-- name: GetSongBySlug :one
-- include_deleted here means "also visible if deleted" (a union, unlike
-- ListSongs' show_deleted above, which is an exclusive toggle) - mirrors the
-- old app's detail-page load, which bypasses the deletedAt filter entirely
-- for a caller holding song:delete rather than requiring a separate
-- "viewing the trash" mode.
SELECT id, title, lyrics, melody, category, created_at, updated_at, deleted_at, slug, video
FROM songs
WHERE slug = $1 AND (sqlc.narg('include_deleted')::bool IS TRUE OR deleted_at IS NULL);

-- name: CountSongSlugsWithPrefix :one
SELECT count(*) FROM songs WHERE slug LIKE $1 || '%';

-- name: ListDistinctSongCategories :many
SELECT DISTINCT category FROM songs
WHERE category IS NOT NULL
  AND (sqlc.narg('include_deleted')::bool IS TRUE OR deleted_at IS NULL)
ORDER BY category;

-- name: ListDistinctSongMelodies :many
SELECT DISTINCT melody FROM songs
WHERE melody IS NOT NULL
  AND (sqlc.narg('include_deleted')::bool IS TRUE OR deleted_at IS NULL)
ORDER BY melody;

-- name: CreateSong :one
INSERT INTO songs (title, lyrics, melody, category, video, slug, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, now(), now())
RETURNING id, title, lyrics, melody, category, created_at, updated_at, deleted_at, slug, video;

-- name: UpdateSong :one
UPDATE songs
SET title = $2, lyrics = $3, melody = $4, category = $5, video = $6, updated_at = now()
WHERE id = $1
RETURNING id, title, lyrics, melody, category, created_at, updated_at, deleted_at, slug, video;

-- name: SoftDeleteSong :exec
UPDATE songs SET deleted_at = now() WHERE id = $1;

-- name: RestoreSong :exec
UPDATE songs SET deleted_at = NULL WHERE id = $1;
