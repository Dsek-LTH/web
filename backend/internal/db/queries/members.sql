-- name: GetMemberByStudentID :one
SELECT id, student_id, first_name, last_name, email, class_year, class_programme
FROM members
WHERE student_id = $1;

-- name: GetAnyMember :one
-- Used only to seed the mock auth identity in dev when no specific member
-- is configured (see internal/auth, main.go). Arbitrary but deterministic
-- enough for local dev: whichever member sorts first by id.
SELECT id, student_id FROM members WHERE student_id IS NOT NULL ORDER BY id LIMIT 1;

-- name: CreateMember :one
-- Minimal port of src/lib/utils/member.ts's createMember: this backend
-- doesn't own subscription_settings or tag subscriptions (nollning-period
-- defaults included), so this only creates the bare Member row those
-- features would otherwise hang off of - a deliberate gap, not an
-- oversight, consistent with nollning being out of scope elsewhere in this
-- rewrite (see DESIGN.md).
INSERT INTO members (student_id, first_name, last_name, email, class_year)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, student_id, first_name, last_name, email, class_year, class_programme;
