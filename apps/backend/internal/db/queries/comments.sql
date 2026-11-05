-- name: ListArticleComments :many
SELECT
    c.id, c.content, c.published,
    m.id AS member_id, m.student_id AS member_student_id,
    m.first_name AS member_first_name, m.last_name AS member_last_name,
    m.nickname AS member_nickname, m.picture_path AS member_picture_path
FROM article_comments c
JOIN members m ON m.id = c.member_id
WHERE c.article_id = sqlc.arg('article_id')
ORDER BY c.published DESC;

-- name: CreateArticleComment :one
INSERT INTO article_comments (article_id, member_id, content, published)
VALUES (sqlc.arg('article_id'), sqlc.arg('member_id'), sqlc.arg('content'), now())
RETURNING id, published;

-- name: DeleteArticleComment :exec
DELETE FROM article_comments
WHERE id = sqlc.arg('comment_id') AND article_id = sqlc.arg('article_id');

-- name: GetArticleCommentMemberID :one
SELECT member_id FROM article_comments
WHERE id = sqlc.arg('comment_id') AND article_id = sqlc.arg('article_id');
