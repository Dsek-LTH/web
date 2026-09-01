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
