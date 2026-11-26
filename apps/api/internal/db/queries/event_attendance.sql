-- Going/interested are mutually exclusive in the UI (see
-- internal/events.Service.SetGoing/SetInterested/ClearAttendance), but that
-- exclusivity isn't a DB constraint - same situation as the old Prisma
-- code, which only enforced it by always writing both relations together
-- from three fixed call sites. Each pair of queries below is called
-- together for that reason.

-- name: AddEventGoing :exec
INSERT INTO _event_going ("A", "B")
VALUES (sqlc.arg('event_id'), sqlc.arg('member_id'))
ON CONFLICT ("A", "B") DO NOTHING;

-- name: RemoveEventGoing :exec
DELETE FROM _event_going
WHERE "A" = sqlc.arg('event_id') AND "B" = sqlc.arg('member_id');

-- name: AddEventInterested :exec
INSERT INTO _event_interested ("A", "B")
VALUES (sqlc.arg('event_id'), sqlc.arg('member_id'))
ON CONFLICT ("A", "B") DO NOTHING;

-- name: RemoveEventInterested :exec
DELETE FROM _event_interested
WHERE "A" = sqlc.arg('event_id') AND "B" = sqlc.arg('member_id');

-- name: ListEventGoing :many
SELECT m.id, m.student_id, m.first_name, m.last_name, m.nickname, m.picture_path
FROM _event_going g
JOIN members m ON m.id = g."B"
WHERE g."A" = sqlc.arg('event_id')
ORDER BY m.first_name;

-- name: ListEventInterested :many
SELECT m.id, m.student_id, m.first_name, m.last_name, m.nickname, m.picture_path
FROM _event_interested i
JOIN members m ON m.id = i."B"
WHERE i."A" = sqlc.arg('event_id')
ORDER BY m.first_name;
