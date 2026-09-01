-- name: GetCurrentSeason :one
-- The season whose window covers right now, if any - internal/nollning
-- treats "at most one season active at a time" as an invariant (not
-- enforced at the DB level, since overlapping seasons would be an admin
-- data error, not a normal state).
SELECT id, year, nolla_start_at, reveal_at, end_at, organizing_committee_id
FROM nollning_seasons
WHERE nolla_start_at <= now() AND now() <= end_at
ORDER BY nolla_start_at DESC
LIMIT 1;

-- name: ListSeasons :many
SELECT id, year, nolla_start_at, reveal_at, end_at, organizing_committee_id
FROM nollning_seasons
ORDER BY year DESC;

-- name: GetSeason :one
SELECT id, year, nolla_start_at, reveal_at, end_at, organizing_committee_id
FROM nollning_seasons
WHERE id = $1;

-- name: CreateSeason :one
INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at, organizing_committee_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, year, nolla_start_at, reveal_at, end_at, organizing_committee_id;

-- name: UpdateSeason :one
UPDATE nollning_seasons
SET year = $2, nolla_start_at = $3, reveal_at = $4, end_at = $5, organizing_committee_id = $6
WHERE id = $1
RETURNING id, year, nolla_start_at, reveal_at, end_at, organizing_committee_id;

-- name: IsMemberActiveOnCommittee :one
-- Backs IsStaben: does memberID hold a mandate, active today, on a position
-- belonging to committeeID.
SELECT EXISTS (
    SELECT 1
    FROM mandates m
    JOIN positions p ON p.id = m.position_id
    WHERE m.member_id = $1
      AND p.committee_id = $2
      AND m.start_date <= CURRENT_DATE
      AND m.end_date >= CURRENT_DATE
);

-- name: ListPhadderGroups :many
-- Nolla/phadder counts alongside each group, mirroring
-- ListCommitteesWithCounts' count-subquery pattern.
SELECT g.id, g.name, g.description, g.image_url, g."createdAt", g.season_id,
       count(DISTINCT nolla.id) AS nolla_count,
       count(DISTINCT phadder_mandate.id) AS phadder_count
FROM phadder_groups g
LEFT JOIN members nolla ON nolla.nollning_group_id = g.id
LEFT JOIN mandates phadder_mandate ON phadder_mandate."phadderInId" = g.id
WHERE sqlc.narg('season_id')::uuid IS NULL OR g.season_id = sqlc.narg('season_id')::uuid
GROUP BY g.id
ORDER BY g."createdAt";

-- name: GetPhadderGroup :one
SELECT id, name, description, image_url, "createdAt", season_id
FROM phadder_groups
WHERE id = $1;

-- name: CreatePhadderGroup :one
INSERT INTO phadder_groups (name, description, image_url, season_id)
VALUES ($1, $2, $3, $4)
RETURNING id, name, description, image_url, "createdAt", season_id;

-- name: UpdatePhadderGroup :one
UPDATE phadder_groups
SET name = $2, description = $3, image_url = $4, season_id = $5
WHERE id = $1
RETURNING id, name, description, image_url, "createdAt", season_id;

-- name: DeletePhadderGroup :exec
DELETE FROM phadder_groups WHERE id = $1;

-- name: ListNollorForGroup :many
SELECT id, student_id, first_name, nickname, last_name, picture_path
FROM members
WHERE nollning_group_id = $1
ORDER BY last_name, first_name;

-- name: ListPhaddrarForGroup :many
-- Distinct members holding a mandate tagged to this group (a member can in
-- principle hold more than one such mandate - see FindActivePhadderMandate).
SELECT DISTINCT mem.id, mem.student_id, mem.first_name, mem.nickname, mem.last_name, mem.picture_path
FROM mandates m
JOIN members mem ON mem.id = m.member_id
WHERE m."phadderInId" = $1
ORDER BY mem.last_name, mem.first_name;

-- name: SetMemberPhadderGroup :exec
UPDATE members SET nollning_group_id = $2 WHERE id = $1;

-- name: ClearMemberPhadderGroup :exec
-- Only clears if the member is currently in exactly this group - mirrors
-- the old Prisma `disconnect`, which is a no-op unless the relation
-- actually exists.
UPDATE members SET nollning_group_id = NULL WHERE id = $1 AND nollning_group_id = $2;

-- name: FindActivePhadderMandate :one
-- The member's phadder/uppdrag mandate overlapping the group's season
-- window, ordered like the old getPhadderMandates (position id asc, i.e.
-- "phadder" before "uppdrag", then start_date asc) so the first row is the
-- same one the old TS picked with `mandates?.[0]`.
SELECT id, position_id, start_date, end_date
FROM mandates
WHERE member_id = $1
  AND position_id IN ('dsek.noll.phadder', 'dsek.noll.uppdrag')
  AND start_date <= $2
  AND end_date >= $3
ORDER BY position_id ASC, start_date ASC
LIMIT 1;

-- name: SetMandatePhadderGroup :exec
UPDATE mandates SET "phadderInId" = $2 WHERE id = $1;

-- name: ClearMandatePhadderGroupForMember :exec
-- Mirrors the old removePhadder action: clears every one of this member's
-- mandates currently tagged to this group (not just the single "active"
-- one FindActivePhadderMandate would pick), matching the old code's
-- `mandates.map(...)` bulk-disconnect over every matching mandate.
UPDATE mandates
SET "phadderInId" = NULL
WHERE member_id = $1
  AND "phadderInId" = $2
  AND position_id IN ('dsek.noll.phadder', 'dsek.noll.uppdrag');

-- name: GetMemberNollaGroupID :one
-- Backs PhadderRoleFor's "nolla" branch.
SELECT nollning_group_id FROM members WHERE id = $1;

-- name: GetMemberPhadderGroupID :one
-- Backs PhadderRoleFor's "phadder" branch: which group (if any) this
-- member holds an active phadder/uppdrag mandate pointed at.
SELECT "phadderInId"
FROM mandates
WHERE member_id = $1
  AND position_id IN ('dsek.noll.phadder', 'dsek.noll.uppdrag')
  AND "phadderInId" IS NOT NULL
ORDER BY position_id ASC, start_date ASC
LIMIT 1;
