-- name: AddArticleLike :exec
INSERT INTO _article_likes ("A", "B")
VALUES (sqlc.arg('article_id'), sqlc.arg('member_id'))
ON CONFLICT ("A", "B") DO NOTHING;

-- name: RemoveArticleLike :exec
DELETE FROM _article_likes
WHERE "A" = sqlc.arg('article_id') AND "B" = sqlc.arg('member_id');

-- name: ListArticleLikers :many
SELECT m.id, m.student_id, m.first_name, m.last_name, m.nickname, m.picture_path
FROM _article_likes l
JOIN members m ON m.id = l."B"
WHERE l."A" = sqlc.arg('article_id')
ORDER BY m.first_name;
