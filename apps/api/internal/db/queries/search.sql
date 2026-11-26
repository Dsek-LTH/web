-- Full-table reads for the Meilisearch rebuild (internal/search). Each one
-- mirrors the Prisma findMany the old src/lib/search/sync.ts ran for that
-- index.

-- name: ListMembersForSearch :many
SELECT id, student_id, first_name, last_name, nickname, picture_path,
       class_year, class_programme
FROM members
ORDER BY student_id;

-- name: ListSongsForSearch :many
SELECT id, title, category, lyrics, melody, slug
FROM songs
WHERE deleted_at IS NULL
ORDER BY title;

-- Same visibility rule as the public article list (published, not
-- scheduled for later, not removed).
-- name: ListArticlesForSearch :many
SELECT a.id, a.header_sv, a.header_en, a.body_sv, a.body_en, a.slug,
       a.published_datetime,
       m.first_name AS author_first_name, m.last_name AS author_last_name,
       m.nickname AS author_nickname, m.picture_path AS author_picture_path
FROM articles a
JOIN authors au ON au.id = a.author_id
JOIN members m ON m.id = au.member_id
WHERE a.removed_at IS NULL
  AND a.published_datetime IS NOT NULL
  AND a.published_datetime <= now()
ORDER BY a.published_datetime;

-- name: ListEventsForSearch :many
SELECT id, title_sv, title_en, description_sv, description_en, slug,
       start_datetime, end_datetime, location
FROM events
WHERE removed_at IS NULL
ORDER BY start_datetime;

-- name: ListPositionsForSearch :many
SELECT p.id, p.name_sv, p.name_en, p.description_sv, p.description_en,
       c.id AS committee_id, c.short_name AS committee_short_name,
       c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
       c.dark_image_url AS committee_dark_image_url,
       c.light_image_url AS committee_light_image_url,
       c.mono_image_url AS committee_mono_image_url
FROM positions p
LEFT JOIN committees c ON c.id = p.committee_id
ORDER BY p.name_sv;

-- name: ListCommitteesForSearch :many
SELECT id, short_name, name_sv, name_en, description_sv, description_en,
       dark_image_url, light_image_url, mono_image_url
FROM committees
ORDER BY short_name;

-- name: ListGoverningDocumentsForSearch :many
SELECT id, title, type, url
FROM documents
WHERE deleted_at IS NULL;
