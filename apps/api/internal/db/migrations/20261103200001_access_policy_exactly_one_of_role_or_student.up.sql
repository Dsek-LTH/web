-- Enforce "grants either a role or a specific student_id, never both, never
-- neither" at the DB level. Previously enforced only by a zod .refine() in
-- the (unimplemented-UI) SvelteKit admin form - app-level-only enforcement
-- is TOCTOU-prone under concurrent requests, so this moves the invariant
-- into the database.
--
-- The old app could still write rows breaking it (the info-page editor
-- granted `studentId: user?.studentId` with no role), and one such row would
-- make this migration fail. Fix them first, keeping what they granted:
-- - neither set: matched no caller, so granted nothing; delete them.
-- - both set: matched callers with the role or the student id; split them
--   into a role row and a student row.
DELETE FROM api_access_policies WHERE role IS NULL AND student_id IS NULL;

INSERT INTO api_access_policies (api_name, student_id, created_at)
SELECT api_name, student_id, created_at
FROM api_access_policies
WHERE role IS NOT NULL AND student_id IS NOT NULL;

UPDATE api_access_policies
SET student_id = NULL
WHERE role IS NOT NULL AND student_id IS NOT NULL;

ALTER TABLE api_access_policies
    ADD CONSTRAINT access_policy_exactly_one_of_role_or_student
    CHECK ((role IS NOT NULL) <> (student_id IS NOT NULL));
