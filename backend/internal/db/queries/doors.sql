-- name: ListDoors :many
SELECT name, id, verbose_name FROM doors ORDER BY verbose_name;

-- name: GetDoorByName :one
SELECT name, id, verbose_name FROM doors WHERE name = $1;

-- name: ListDoorAccessPoliciesForAdmin :many
-- The admin edit-door page's own list: every non-expired policy for a
-- door (start in the future is fine, still shown - only end in the past
-- is excluded), joined to the member it names if it's a studentId-scoped
-- row. Deliberately not filtered by start_datetime, unlike
-- ListActiveDoorAccessPoliciesForSalto below - mirrors the old
-- edit/[slug]/+page.server.ts load exactly.
SELECT dap.id, dap.door_name, dap.role, dap.student_id, dap.start_datetime,
       dap.end_datetime, dap.is_ban, dap.information,
       m.id AS member_id, m.first_name AS member_first_name,
       m.last_name AS member_last_name, m.nickname AS member_nickname
FROM door_access_policies dap
LEFT JOIN members m ON m.student_id = dap.student_id
WHERE dap.door_name = sqlc.arg('door_name')
  AND (dap.end_datetime >= now() OR dap.end_datetime IS NULL)
ORDER BY dap.start_datetime ASC, dap.role ASC, dap.student_id ASC;

-- name: ListActiveDoorAccessPoliciesForSalto :many
-- The real security-relevant read: policies currently in their active
-- window (both start and end), for GET /salto/{door} to resolve into an
-- allowed-student list. Unlike ListDoorAccessPoliciesForAdmin, a
-- not-yet-started policy is excluded here - matches the old +server.ts's
-- own filter exactly.
SELECT role, student_id, is_ban
FROM door_access_policies
WHERE door_name = sqlc.arg('door_name')
  AND (start_datetime <= now() OR start_datetime IS NULL)
  AND (end_datetime >= now() OR end_datetime IS NULL);

-- name: CreateDoorAccessPolicy :one
INSERT INTO door_access_policies (door_name, role, student_id, start_datetime, end_datetime, is_ban, information)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, door_name, role, student_id, start_datetime, end_datetime, is_ban, information;

-- name: DeleteDoorAccessPolicy :exec
DELETE FROM door_access_policies WHERE id = $1;

-- name: ExistsPositionWithPrefix :one
-- pattern is built by the caller as "{prefix}%" - a real SQL LIKE
-- wildcard, unlike the old TS's `startsWith(`${p}%`)`, which (per Prisma's
-- literal-escaping of startsWith) only ever matched a position id that
-- literally contained a "%" character, i.e. never. User-confirmed fix
-- (2026-09-03, see DESIGN.md's Phase 10 entry): role-based door/create-form
-- validation now does a real prefix match.
SELECT EXISTS(SELECT 1 FROM positions WHERE id LIKE sqlc.arg('pattern')::text) AS exists;

-- name: ListPositionIDsMatchingPrefixes :many
-- patterns are caller-built "{role}%" LIKE patterns, one per non-wildcard
-- role a door policy names - see ExistsPositionWithPrefix's doc comment for
-- why this is a real prefix match, not the old app's broken literal one.
SELECT id FROM positions WHERE id LIKE ANY(sqlc.arg('patterns')::text[]);

-- name: ListStudentIDsForActivePositions :many
-- Current (start_date <= today <= end_date) mandate holders of any of the
-- given positions - the role-based half of salto's allowed-student list.
SELECT DISTINCT m.student_id
FROM mandates ma
JOIN members m ON m.id = ma.member_id
WHERE ma.position_id = ANY(sqlc.arg('position_ids')::text[])
  AND ma.start_date <= CURRENT_DATE AND ma.end_date >= CURRENT_DATE
  AND m.student_id IS NOT NULL;

-- name: ListRecentMemberStudentIDs :many
-- Backs the "*" wildcard role (see 2024-11-25's "Added support for
-- wildcard roles in door access policies") - every member whose class year
-- is within the last ~10 years, matching the old app's
-- `classYear: {gte: currentYear - 10}` exactly.
SELECT student_id FROM members
WHERE class_year >= sqlc.arg('min_class_year')::int AND student_id IS NOT NULL;

-- name: ListActivePositionsForMemberByStudentID :many
-- Backs the member profile page's own "which doors do I have access to"
-- widget (self-view only) - a member's currently-held positions, used to
-- both derive candidate door-policy roles and to display position names
-- instead of raw role strings in the result.
SELECT p.id, p.name_sv, p.name_en, p.board_member
FROM positions p
JOIN mandates ma ON ma.position_id = p.id
JOIN members m ON m.id = ma.member_id
WHERE m.student_id = sqlc.arg('student_id')
  AND ma.start_date <= CURRENT_DATE AND ma.end_date >= CURRENT_DATE;

-- name: ListDoorAccessPoliciesForMemberView :many
-- The self-view widget's own policy read: non-banned policies either
-- naming this member's studentId directly, or naming one of their
-- candidate derived roles (every dot-prefix of each held position id, plus
-- "*"/"_"/"dsek.styr" as applicable - computed in Go, mirroring
-- getDerivedRoles - and passed in as roles). Exact role equality, not a
-- prefix LIKE - this is the opposite direction from salto's own matching
-- (there, a stored role is a prefix of a position id; here, a candidate
-- role is checked for exact membership).
SELECT dap.door_name, dor.verbose_name, dap.role, dap.student_id,
       dap.start_datetime, dap.end_datetime
FROM door_access_policies dap
JOIN doors dor ON dor.name = dap.door_name
WHERE dap.is_ban = false
  AND (dap.start_datetime <= now() OR dap.start_datetime IS NULL)
  AND (dap.end_datetime >= now() OR dap.end_datetime IS NULL)
  AND (
    dap.student_id = sqlc.arg('student_id')
    OR dap.role = ANY(sqlc.arg('roles')::text[])
  );
