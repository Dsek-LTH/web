-- name: ListSongBookEntries :many
-- A numeric search matches the page; anything else searches song titles.
-- Entries whose song is soft-deleted are only listed for show_deleted.
SELECT e.page, e.number_on_page, s.id, s.title, s.lyrics, s.slug, s.melody,
       s.category, s.created_at, s.updated_at, s.deleted_at, s.video
FROM song_book_entries e
JOIN songs s ON s.id = e.song_id
WHERE (sqlc.arg(show_deleted)::bool OR s.deleted_at IS NULL)
  AND (
    sqlc.narg(page_search)::int IS NULL OR e.page = sqlc.narg(page_search)::int
  )
  AND (
    sqlc.narg(title_search)::text IS NULL
    OR s.title ILIKE '%' || sqlc.narg(title_search)::text || '%'
  )
ORDER BY e.page, e.number_on_page
LIMIT sqlc.arg(row_limit) OFFSET sqlc.arg(row_offset);

-- name: CountSongBookEntries :one
SELECT count(*)
FROM song_book_entries e
JOIN songs s ON s.id = e.song_id
WHERE (sqlc.arg(show_deleted)::bool OR s.deleted_at IS NULL)
  AND (
    sqlc.narg(page_search)::int IS NULL OR e.page = sqlc.narg(page_search)::int
  )
  AND (
    sqlc.narg(title_search)::text IS NULL
    OR s.title ILIKE '%' || sqlc.narg(title_search)::text || '%'
  );

-- name: GetSongBookEntry :one
SELECT e.page, e.number_on_page, s.id, s.title, s.lyrics, s.slug, s.melody,
       s.category, s.created_at, s.updated_at, s.deleted_at, s.video
FROM song_book_entries e
JOIN songs s ON s.id = e.song_id
WHERE e.page = sqlc.arg(page) AND e.number_on_page = sqlc.arg(number_on_page)
  AND (sqlc.arg(show_deleted)::bool OR s.deleted_at IS NULL);

-- name: SongBookPositionTaken :one
-- Whether (page, number_on_page) belongs to an entry other than the one at
-- (except_page, except_number), which is the entry being edited (NULLs for
-- a create).
SELECT EXISTS (
    SELECT 1 FROM song_book_entries
    WHERE page = sqlc.arg(page) AND number_on_page = sqlc.arg(number_on_page)
      AND NOT (
        page IS NOT DISTINCT FROM sqlc.narg(except_page)::int
        AND number_on_page IS NOT DISTINCT FROM sqlc.narg(except_number)::int
      )
);

-- name: SongInSongBook :one
-- Whether song_id already has an entry other than the one being edited.
SELECT EXISTS (
    SELECT 1 FROM song_book_entries
    WHERE song_id = sqlc.arg(song_id)
      AND NOT (
        page IS NOT DISTINCT FROM sqlc.narg(except_page)::int
        AND number_on_page IS NOT DISTINCT FROM sqlc.narg(except_number)::int
      )
);

-- name: CreateSongBookEntry :exec
INSERT INTO song_book_entries (song_id, page, number_on_page, updated_at)
VALUES ($1, $2, $3, now());

-- name: UpdateSongBookEntry :execrows
UPDATE song_book_entries
SET song_id = sqlc.arg(song_id), page = sqlc.arg(page),
    number_on_page = sqlc.arg(number_on_page), updated_at = now()
WHERE page = sqlc.arg(old_page) AND number_on_page = sqlc.arg(old_number);

-- name: DeleteSongBookEntry :execrows
DELETE FROM song_book_entries
WHERE page = $1 AND number_on_page = $2;

-- name: SongExists :one
SELECT EXISTS (SELECT 1 FROM songs WHERE id = $1 AND deleted_at IS NULL);
