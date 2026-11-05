-- name: ListMarkdownsByPrefix :many
-- Lists every markdowns row whose name matches prefix (a plain LIKE
-- pattern, e.g. "cafe:open%") - internal/cafe's own private reuse of the
-- markdowns table, same pattern as internal/committees' direct
-- GetMarkdown call. internal/markdown itself only ever fetches one named
-- page at a time, so this doesn't belong there.
SELECT name, markdown_sv, markdown_en
FROM markdowns
WHERE name LIKE sqlc.arg('prefix')
ORDER BY name ASC;

-- name: ListCafeShiftsInRange :many
-- Every shift (with its worker) in [start_date, end_date] inclusive -
-- start_date/end_date share the same TIMESTAMP(3) precision as the
-- column, so callers pass day-aligned bounds. Used both for a week's
-- worth of shifts (ListShifts) and for a single day's shifts (the
-- toggle logic in SetShift, which needs every slot for one date at once,
-- mirroring the old updateSchedule action's single dayShifts query).
SELECT cs.id, cs.date, cs."workerId", cs.time_slot,
       m.id AS worker_member_id, m.student_id AS worker_student_id,
       m.first_name AS worker_first_name, m.last_name AS worker_last_name,
       m.nickname AS worker_nickname, m.picture_path AS worker_picture_path
FROM cafe_shifts cs
JOIN members m ON m.id = cs."workerId"
WHERE cs.date >= sqlc.arg('start_date') AND cs.date <= sqlc.arg('end_date')
ORDER BY cs.date ASC, cs.time_slot ASC;

-- name: GetCafeShiftByID :one
-- Re-fetches a single shift with its worker joined, after
-- CreateCafeShift/UpdateCafeShiftWorker's own RETURNING (which has no room
-- for the join) - used to build the full Shift (with nickname/picture)
-- SetShift returns.
SELECT cs.id, cs.date, cs."workerId", cs.time_slot,
       m.id AS worker_member_id, m.student_id AS worker_student_id,
       m.first_name AS worker_first_name, m.last_name AS worker_last_name,
       m.nickname AS worker_nickname, m.picture_path AS worker_picture_path
FROM cafe_shifts cs
JOIN members m ON m.id = cs."workerId"
WHERE cs.id = sqlc.arg('id');

-- name: CreateCafeShift :one
INSERT INTO cafe_shifts (date, "workerId", time_slot)
VALUES (sqlc.arg('date'), sqlc.arg('worker_id'), sqlc.arg('time_slot'))
RETURNING id, date, "workerId", time_slot;

-- name: UpdateCafeShiftWorker :one
-- Reassigns an existing shift to a different worker - the admin-only
-- "there's already a shift here, but not this member's" branch.
UPDATE cafe_shifts SET "workerId" = sqlc.arg('worker_id')
WHERE id = sqlc.arg('id')
RETURNING id, date, "workerId", time_slot;

-- name: DeleteCafeShift :execrows
DELETE FROM cafe_shifts WHERE id = sqlc.arg('id');

-- name: GetCiabattaByYearWeek :one
SELECT id, year, week, name FROM ciabatta_of_the_week
WHERE year = sqlc.arg('year') AND week = sqlc.arg('week');

-- name: UpsertCiabatta :one
INSERT INTO ciabatta_of_the_week (year, week, name)
VALUES (sqlc.arg('year'), sqlc.arg('week'), sqlc.arg('name'))
ON CONFLICT (year, week) DO UPDATE SET name = sqlc.arg('name')
RETURNING id, year, week, name;
