-- name: AddArticleLike :exec
INSERT INTO _article_likes ("A", "B")
VALUES (sqlc.arg('article_id'), sqlc.arg('member_id'))
ON CONFLICT ("A", "B") DO NOTHING;

-- name: RemoveArticleLike :exec
DELETE FROM _article_likes
WHERE "A" = sqlc.arg('article_id') AND "B" = sqlc.arg('member_id');
