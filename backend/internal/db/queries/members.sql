-- name: GetMemberByStudentID :one
SELECT id, student_id, first_name, last_name, email, class_year, class_programme
FROM members
WHERE student_id = $1;

-- name: GetAnyMember :one
-- Used only to seed the mock auth identity in dev when no specific member
-- is configured (see internal/auth, main.go). Arbitrary but deterministic
-- enough for local dev: whichever member sorts first by id.
SELECT id, student_id FROM members WHERE student_id IS NOT NULL ORDER BY id LIMIT 1;

-- name: ListMembers :many
-- Mirrors the old members-directory page's filter: both params are
-- optional (a NULL narg matches everything) - the old TS route required
-- classYear, but that was a SvelteKit-page UX constraint (it needed a
-- value to pre-fill a dropdown), not an intentional API restriction.
SELECT id, student_id, first_name, nickname, last_name, picture_path, class_programme, class_year
FROM members
WHERE (sqlc.narg('class_year')::int IS NULL OR class_year = sqlc.narg('class_year')::int)
  AND (sqlc.narg('class_programme')::text IS NULL OR class_programme = sqlc.narg('class_programme')::text)
ORDER BY first_name, last_name, class_programme;

-- name: GetMemberProfile :one
-- Full column set for a member's own profile page, unlike
-- GetMemberByStudentID's minimal projection (built only for author
-- resolution).
SELECT id, student_id, first_name, nickname, last_name, picture_path, class_programme,
       class_year, visible, food_preference, bio, email, graduation_year, language
FROM members
WHERE student_id = $1;

-- name: UpdateMemberProfile :one
UPDATE members
SET first_name = $2, last_name = $3, nickname = $4, class_programme = $5,
    class_year = $6, graduation_year = $7, language = $8, bio = $9
WHERE student_id = $1
RETURNING id, student_id, first_name, nickname, last_name, picture_path, class_programme,
          class_year, visible, food_preference, bio, email, graduation_year, language;

-- name: UpdateMemberFoodPreference :one
UPDATE members
SET food_preference = $2
WHERE student_id = $1
RETURNING id, student_id, first_name, nickname, last_name, picture_path, class_programme,
          class_year, visible, food_preference, bio, email, graduation_year, language;

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
