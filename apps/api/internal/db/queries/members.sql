-- name: GetMemberByStudentID :one
SELECT id, student_id, first_name, last_name, email, class_year, class_programme
FROM members
WHERE student_id = $1;

-- name: GetAnyMember :one
-- Used only to seed the mock auth identity in dev when no specific member
-- is configured (see internal/auth, cmd/api). Arbitrary but deterministic
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

-- name: ListVisibleMembersWithBirthDate :many
-- Candidates for the home page's birthday list; whose birthday is today is
-- decided in Go (members.BirthdayOn), which also handles 29 February.
SELECT id, student_id, first_name, nickname, last_name, picture_path, birth_date
FROM members
WHERE visible AND birth_date IS NOT NULL
ORDER BY first_name, last_name;

-- name: GetMemberProfile :one
-- Full column set for a member's own profile page, unlike
-- GetMemberByStudentID's minimal projection (built only for author
-- resolution).
SELECT id, student_id, first_name, nickname, last_name, picture_path, class_programme,
       class_year, visible, food_preference, bio, email, graduation_year, language, birth_date
FROM members
WHERE student_id = $1;

-- name: UpdateMemberProfile :one
UPDATE members
SET first_name = $2, last_name = $3, nickname = $4, class_programme = $5,
    class_year = $6, graduation_year = $7, language = $8, bio = $9, birth_date = $10
WHERE student_id = $1
RETURNING id, student_id, first_name, nickname, last_name, picture_path, class_programme,
          class_year, visible, food_preference, bio, email, graduation_year, language, birth_date;

-- name: UpdateMemberFoodPreference :one
UPDATE members
SET food_preference = $2
WHERE student_id = $1
RETURNING id, student_id, first_name, nickname, last_name, picture_path, class_programme,
          class_year, visible, food_preference, bio, email, graduation_year, language, birth_date;

-- name: CreateMember :one
-- Minimal port of src/lib/utils/member.ts's createMember: just the bare
-- Member row. Default subscription_settings/tag-subscription seeding
-- (previously a documented gap here) now happens as a separate step right
-- after this insert - see internal/auth's resolveOrCreateMember and
-- internal/notifications.Service.SeedDefaults (Phase 9).
INSERT INTO members (student_id, first_name, last_name, email, class_year)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, student_id, first_name, last_name, email, class_year, class_programme;

-- name: GetMemberPicturePath :one
SELECT picture_path FROM members WHERE student_id = $1;

-- name: SetMemberPicturePath :execrows
UPDATE members SET picture_path = sqlc.narg('picture_path') WHERE student_id = sqlc.arg('student_id');

-- name: UpdateMemberLanguage :execrows
UPDATE members SET language = sqlc.arg('language') WHERE student_id = sqlc.arg('student_id');

-- name: GetMemberNollaGroup :one
-- The phadder group the member was a nolla in, whatever season - the
-- profile's permanent "nolla in" record (members.nollning_group_id is
-- never cleared after a season).
SELECT g.id, g.name, g.image_url, s.year
FROM members m
JOIN phadder_groups g ON g.id = m.nollning_group_id
JOIN nollning_seasons s ON s.id = g.season_id
WHERE m.id = sqlc.arg('member_id');
