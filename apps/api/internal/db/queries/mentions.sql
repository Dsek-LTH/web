-- name: ListMembersByStudentIDs :many
-- Resolves @mentions in comments (see internal/mentions).
SELECT id, student_id, first_name, last_name, nickname, picture_path
FROM members
WHERE student_id = ANY(sqlc.arg('student_ids')::text[]);
