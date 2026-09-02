-- name: ListAccessPolicies :many
-- Optional apiName filter; joins member first/last name for studentId-scoped
-- rows (role-scoped rows have no member to join).
SELECT ap.id, ap.api_name, ap.role, ap.student_id, ap.created_at,
       m.first_name AS member_first_name, m.last_name AS member_last_name
FROM api_access_policies ap
LEFT JOIN members m ON m.student_id = ap.student_id
WHERE sqlc.narg('api_name')::text IS NULL OR ap.api_name = sqlc.narg('api_name')::text
ORDER BY ap.api_name, ap.created_at;

-- name: ListDistinctAPINames :many
SELECT DISTINCT api_name FROM api_access_policies ORDER BY api_name;

-- name: CreateAccessPolicy :one
INSERT INTO api_access_policies (api_name, role, student_id)
VALUES ($1, $2, $3)
RETURNING id, api_name, role, student_id, created_at;

-- name: DeleteAccessPolicy :exec
DELETE FROM api_access_policies WHERE id = $1;

-- name: ListPoliciesForRolesOrStudentID :many
-- Mirrors hooks.server.helpers.ts's getAccessPolicies: a policy applies if
-- it's granted to any of the caller's derived roles, or to their
-- student_id specifically. Pass a NULL student_id for an anonymous caller
-- (no derived roles are ever real student ids) - "student_id = NULL" never
-- matches, which is the same no-op the old code got from Prisma ignoring
-- an undefined filter.
SELECT api_name
FROM api_access_policies
WHERE role = ANY(sqlc.arg('roles')::text[])
   OR student_id = sqlc.narg('student_id');
