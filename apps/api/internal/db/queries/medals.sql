-- name: ListMemberMandatesWithPosition :many
-- Full mandate history for one member, joined to board_member/committee_id
-- - everything memberMedals (src/lib/server/medals/medals.ts) needs to
-- compute that member's own medal semesters.
SELECT m.start_date, m.end_date, p.board_member, p.committee_id
FROM mandates m
JOIN positions p ON p.id = m.position_id
WHERE m.member_id = $1;

-- name: ListMemberIDsWithMandateActiveDuring :many
-- Distinct members who held any mandate active during [start, end) - the
-- candidate set medalRecipients scopes its per-member computation to,
-- mirroring the old app's mandatesInAfter query exactly.
SELECT DISTINCT member_id
FROM mandates
WHERE start_date < sqlc.arg('window_end')::date AND end_date >= sqlc.arg('window_start')::date;

-- name: ListMandatesForMembersBefore :many
-- All mandates (not just active-during-the-window ones) for a given member
-- set, that started before the cutoff - mirrors the old app's allMandates
-- query, which only bounds start_date (no end_date filter) since award
-- semesters are computed by intersecting with "after" in Go, not in SQL.
SELECT mn.member_id, mn.start_date, mn.end_date, p.board_member, p.committee_id
FROM mandates mn
JOIN positions p ON p.id = mn.position_id
WHERE mn.member_id = ANY(sqlc.arg('member_ids')::uuid[])
  AND mn.start_date < sqlc.arg('cutoff')::date;

-- name: ListCommitteesWithMedals :many
-- Committees eligible for a committee medal - excludes the same fixed
-- short_name set the old app hardcoded (valb/other/dchip/medalj).
SELECT id, name_sv, name_en
FROM committees
WHERE short_name IS NULL OR short_name NOT IN ('valb', 'other', 'dchip', 'medalj');

-- name: ListMembersByIDs :many
SELECT id, student_id, first_name, last_name
FROM members
WHERE id = ANY($1::uuid[]);
