-- name: ListEventComments :many
SELECT
    c.id, c.content, c.published,
    m.id AS member_id, m.student_id AS member_student_id,
    m.first_name AS member_first_name, m.last_name AS member_last_name,
    m.nickname AS member_nickname, m.picture_path AS member_picture_path
FROM event_comments c
JOIN members m ON m.id = c.member_id
WHERE c.event_id = sqlc.arg('event_id')
ORDER BY c.published ASC;

-- name: CreateEventComment :one
INSERT INTO event_comments (event_id, member_id, content, published)
VALUES (sqlc.arg('event_id'), sqlc.arg('member_id'), sqlc.arg('content'), now())
RETURNING id, published;

-- name: DeleteEventComment :exec
DELETE FROM event_comments
WHERE id = sqlc.arg('comment_id') AND event_id = sqlc.arg('event_id');
