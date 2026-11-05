-- Enforce "grants either a role or a specific student_id, never both, never
-- neither" at the DB level. Previously enforced only by a zod .refine() in
-- the (unimplemented-UI) SvelteKit admin form - app-level-only enforcement
-- is TOCTOU-prone under concurrent requests, so this moves the invariant
-- into the database.
ALTER TABLE api_access_policies
    ADD CONSTRAINT access_policy_exactly_one_of_role_or_student
    CHECK ((role IS NOT NULL) <> (student_id IS NOT NULL));
