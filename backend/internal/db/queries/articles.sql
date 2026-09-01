-- Shared column list for the "joined article" shape: article + committee +
-- author (member / mandate+position / custom author) + comment & like
-- counts. Duplicated across ListArticles/GetArticleBySlug/GetArticleRowBySlug
-- because sqlc has no macro/fragment support.

-- name: ListArticles :many
SELECT
    a.id, a.header_sv, a.header_en, a.body_sv, a.body_en, a.image_url,
    a.author_id, a.published_datetime, a.latest_edit_datetime, a.slug,
    a.removed_at, a.status, a.created_datetime, a.youtube_url, a.image_urls,
    a.notification_text, a.should_send_notification, a.scheduled_id, a.committee_id,
    c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
    c.short_name AS committee_short_name, c.symbol_url AS committee_symbol_url,
    au.type AS author_type,
    m.id AS member_id, m.student_id AS member_student_id,
    m.first_name AS member_first_name, m.last_name AS member_last_name,
    m.nickname AS member_nickname, m.picture_path AS member_picture_path,
    p.id AS position_id, p.name_sv AS position_name_sv, p.name_en AS position_name_en,
    ca.id AS custom_author_id, ca.name_sv AS custom_author_name_sv,
    ca.name_en AS custom_author_name_en, ca.image_url AS custom_author_image_url,
    COALESCE(cm.n, 0)::int AS comment_count,
    COALESCE(lk.n, 0)::int AS like_count
FROM articles a
JOIN authors au ON au.id = a.author_id
JOIN members m ON m.id = au.member_id
LEFT JOIN mandates mn ON mn.id = au.mandate_id
LEFT JOIN positions p ON p.id = mn.position_id
LEFT JOIN custom_authors ca ON ca.id = au.custom_id
LEFT JOIN committees c ON c.id = a.committee_id
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM article_comments WHERE article_id = a.id
) cm ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _article_likes WHERE "A" = a.id
) lk ON true
WHERE a.published_datetime IS NOT NULL
  AND a.published_datetime <= now()
  AND (a.removed_at IS NULL OR a.removed_at > now())
  AND (
    sqlc.narg('search')::text IS NULL
    OR a.header_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR a.header_en ILIKE '%' || sqlc.narg('search')::text || '%'
    OR a.body_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR a.body_en ILIKE '%' || sqlc.narg('search')::text || '%'
  )
  AND (
    sqlc.narg('tag_ids')::uuid[] IS NULL
    OR EXISTS (
        SELECT 1 FROM _article_tags t
        WHERE t."A" = a.id AND t."B" = ANY(sqlc.narg('tag_ids')::uuid[])
    )
  )
  AND (sqlc.narg('committee_id')::uuid IS NULL OR a.committee_id = sqlc.narg('committee_id')::uuid)
  AND (sqlc.narg('author_student_id')::text IS NULL OR m.student_id = sqlc.narg('author_student_id')::text)
ORDER BY a.published_datetime DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountArticles :one
SELECT count(*) FROM articles a
JOIN authors au ON au.id = a.author_id
JOIN members m ON m.id = au.member_id
WHERE a.published_datetime IS NOT NULL
  AND a.published_datetime <= now()
  AND (a.removed_at IS NULL OR a.removed_at > now())
  AND (
    sqlc.narg('search')::text IS NULL
    OR a.header_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR a.header_en ILIKE '%' || sqlc.narg('search')::text || '%'
    OR a.body_sv ILIKE '%' || sqlc.narg('search')::text || '%'
    OR a.body_en ILIKE '%' || sqlc.narg('search')::text || '%'
  )
  AND (
    sqlc.narg('tag_ids')::uuid[] IS NULL
    OR EXISTS (
        SELECT 1 FROM _article_tags t
        WHERE t."A" = a.id AND t."B" = ANY(sqlc.narg('tag_ids')::uuid[])
    )
  )
  AND (sqlc.narg('committee_id')::uuid IS NULL OR a.committee_id = sqlc.narg('committee_id')::uuid)
  AND (sqlc.narg('author_student_id')::text IS NULL OR m.student_id = sqlc.narg('author_student_id')::text);

-- name: GetArticleBySlug :one
-- Public lookup: only published, not (currently) removed articles.
SELECT
    a.id, a.header_sv, a.header_en, a.body_sv, a.body_en, a.image_url,
    a.author_id, a.published_datetime, a.latest_edit_datetime, a.slug,
    a.removed_at, a.status, a.created_datetime, a.youtube_url, a.image_urls,
    a.notification_text, a.should_send_notification, a.scheduled_id, a.committee_id,
    c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
    c.short_name AS committee_short_name, c.symbol_url AS committee_symbol_url,
    au.type AS author_type,
    m.id AS member_id, m.student_id AS member_student_id,
    m.first_name AS member_first_name, m.last_name AS member_last_name,
    m.nickname AS member_nickname, m.picture_path AS member_picture_path,
    p.id AS position_id, p.name_sv AS position_name_sv, p.name_en AS position_name_en,
    ca.id AS custom_author_id, ca.name_sv AS custom_author_name_sv,
    ca.name_en AS custom_author_name_en, ca.image_url AS custom_author_image_url,
    COALESCE(cm.n, 0)::int AS comment_count,
    COALESCE(lk.n, 0)::int AS like_count
FROM articles a
JOIN authors au ON au.id = a.author_id
JOIN members m ON m.id = au.member_id
LEFT JOIN mandates mn ON mn.id = au.mandate_id
LEFT JOIN positions p ON p.id = mn.position_id
LEFT JOIN custom_authors ca ON ca.id = au.custom_id
LEFT JOIN committees c ON c.id = a.committee_id
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM article_comments WHERE article_id = a.id
) cm ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _article_likes WHERE "A" = a.id
) lk ON true
WHERE a.slug = $1
  AND a.published_datetime IS NOT NULL
  AND a.published_datetime <= now()
  AND (a.removed_at IS NULL OR a.removed_at > now());

-- name: GetArticleRowBySlug :one
-- Unfiltered lookup: no publish/removed filter. Used internally after
-- create/update (so the caller gets back exactly what it just wrote even if
-- it's a future scheduled draft), and by the ArticleByAnySlug service method
-- for callers - like the SvelteKit edit page - that need to load a draft or
-- future-scheduled article by its own author. There's no auth on this API,
-- so this is no more exposed than the existing unauthenticated mutations;
-- see backend/CLAUDE.md.
SELECT
    a.id, a.header_sv, a.header_en, a.body_sv, a.body_en, a.image_url,
    a.author_id, a.published_datetime, a.latest_edit_datetime, a.slug,
    a.removed_at, a.status, a.created_datetime, a.youtube_url, a.image_urls,
    a.notification_text, a.should_send_notification, a.scheduled_id, a.committee_id,
    c.name_sv AS committee_name_sv, c.name_en AS committee_name_en,
    c.short_name AS committee_short_name, c.symbol_url AS committee_symbol_url,
    au.type AS author_type,
    m.id AS member_id, m.student_id AS member_student_id,
    m.first_name AS member_first_name, m.last_name AS member_last_name,
    m.nickname AS member_nickname, m.picture_path AS member_picture_path,
    p.id AS position_id, p.name_sv AS position_name_sv, p.name_en AS position_name_en,
    ca.id AS custom_author_id, ca.name_sv AS custom_author_name_sv,
    ca.name_en AS custom_author_name_en, ca.image_url AS custom_author_image_url,
    COALESCE(cm.n, 0)::int AS comment_count,
    COALESCE(lk.n, 0)::int AS like_count
FROM articles a
JOIN authors au ON au.id = a.author_id
JOIN members m ON m.id = au.member_id
LEFT JOIN mandates mn ON mn.id = au.mandate_id
LEFT JOIN positions p ON p.id = mn.position_id
LEFT JOIN custom_authors ca ON ca.id = au.custom_id
LEFT JOIN committees c ON c.id = a.committee_id
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM article_comments WHERE article_id = a.id
) cm ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM _article_likes WHERE "A" = a.id
) lk ON true
WHERE a.slug = $1;

-- name: GetArticleIDBySlug :one
SELECT id FROM articles WHERE slug = $1;

-- name: CountArticleSlugsWithPrefix :one
SELECT count(*) FROM articles WHERE slug LIKE $1 || '%';

-- name: CreateArticle :one
INSERT INTO articles (
    header_sv, header_en, body_sv, body_en, image_url, image_urls,
    youtube_url, author_id, published_datetime, should_send_notification,
    notification_text, committee_id, slug
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING id, slug;

-- name: UpdateArticle :one
UPDATE articles SET
    header_sv = $2,
    header_en = $3,
    body_sv = $4,
    body_en = $5,
    image_url = $6,
    image_urls = $7,
    youtube_url = $8,
    author_id = $9,
    published_datetime = $10,
    should_send_notification = $11,
    notification_text = $12,
    committee_id = $13,
    latest_edit_datetime = now()
WHERE slug = $1
RETURNING id, slug;

-- name: SoftDeleteArticle :exec
UPDATE articles SET removed_at = now() WHERE slug = $1;

-- name: SetArticleScheduledID :exec
-- Targeted single-field write: the caller's external scheduler task id,
-- recorded after scheduling a future publish succeeds. Deliberately
-- separate from UpdateArticle (which is full-replace) since this needs to
-- happen without the caller re-submitting the whole article.
UPDATE articles SET scheduled_id = $2 WHERE slug = $1;
