-- name: FindPingBetween :one
-- The pair's row, whichever direction the first ping went.
SELECT id, from_member
FROM pings
WHERE (from_member = sqlc.arg('member_a') AND to_member = sqlc.arg('member_b'))
   OR (from_member = sqlc.arg('member_b') AND to_member = sqlc.arg('member_a'));

-- name: CreatePing :exec
INSERT INTO pings (from_member, to_member, from_sent_at, created_at, count)
VALUES (sqlc.arg('from_member'), sqlc.arg('to_member'), now(), now(), 1);

-- name: RecordPing :exec
-- sent_by_from_member says which direction this ping went relative to the
-- row's own from_member.
UPDATE pings
SET from_sent_at = CASE WHEN sqlc.arg('sent_by_from_member')::bool THEN now() ELSE from_sent_at END,
    to_sent_at   = CASE WHEN sqlc.arg('sent_by_from_member')::bool THEN to_sent_at ELSE now() END,
    count        = count + 1
WHERE id = sqlc.arg('id');
