-- name: CreateNotifications :exec
-- title/message/type/link/from_author_id are constant across one Send call
-- - only member_id varies per recipient - same "constant column + unnest"
-- shape as AddArticleTags.
INSERT INTO notifications (title, message, type, link, member_id, from_author_id)
SELECT sqlc.arg(title)::text, sqlc.arg(message)::text, sqlc.arg(type)::text,
       sqlc.arg(link)::text, unnest(sqlc.arg(member_ids)::uuid[]),
       sqlc.narg(from_author_id)::uuid;

-- name: ListNotificationsForMember :many
SELECT id, title, message, type, link, read_at, member_id, created_at,
       updated_at, from_author_id
FROM notifications
WHERE member_id = $1
ORDER BY created_at DESC;

-- name: ListNollaNotificationsForMember :many
SELECT id, title, message, type, link, read_at, member_id, created_at,
       updated_at, from_author_id
FROM notifications
WHERE member_id = sqlc.arg(member_id)
  AND created_at > sqlc.arg(since)
  AND (type = 'NEW_ARTICLE' OR link LIKE '/nollning%')
ORDER BY created_at DESC;

-- name: MarkNotificationsRead :exec
UPDATE notifications SET read_at = now()
WHERE member_id = sqlc.arg(member_id) AND read_at IS NULL
  AND (sqlc.narg(id)::int IS NULL OR id = sqlc.narg(id))
  AND (sqlc.narg(ids)::int[] IS NULL OR id = ANY(sqlc.narg(ids)::int[]));

-- name: DeleteNotifications :exec
DELETE FROM notifications
WHERE member_id = sqlc.arg(member_id)
  AND (sqlc.narg(id)::int IS NULL OR id = sqlc.narg(id))
  AND (sqlc.narg(ids)::int[] IS NULL OR id = ANY(sqlc.narg(ids)::int[]));

-- name: CountUnreadNotifications :one
SELECT count(*) FROM notifications WHERE member_id = $1 AND read_at IS NULL;

-- name: GetAuthorForNotification :one
-- Resolves the display identity of a notification's sender: the plain
-- member fields, plus (if the author acted via a mandate) that mandate's
-- position name - mirrors getAuthorName's "Mandate" branch. Custom-author
-- bylines never send notifications in practice (no call site does), so
-- that branch isn't modeled here.
SELECT a.id, m.first_name, m.nickname, m.last_name, m.picture_path,
       p.name_sv AS position_name_sv, p.name_en AS position_name_en
FROM authors a
JOIN members m ON m.id = a.member_id
LEFT JOIN mandates ma ON ma.id = a.mandate_id
LEFT JOIN positions p ON p.id = ma.position_id
WHERE a.id = $1;

-- name: ListMembersSubscribedToAnyTag :many
SELECT DISTINCT "A" AS member_id FROM _member_tag_subscriptions WHERE "B" = ANY(sqlc.arg(tag_ids)::uuid[]);

-- name: ListMembersWithSubscriptionSetting :many
-- Members subscribed to settingType, optionally narrowed to a specific
-- candidate id list (mirrors sendNotification's memberIds intersection).
-- Excludes fromMemberID (the sender) and any member already notified about
-- this exact (type, link, fromAuthorId) unless allowDuplicates.
SELECT DISTINCT m.id
FROM members m
JOIN subscription_settings ss ON ss.member_id = m.id AND ss.type = sqlc.arg(setting_type)
WHERE (sqlc.narg(candidate_ids)::uuid[] IS NULL OR m.id = ANY(sqlc.narg(candidate_ids)::uuid[]))
  AND (sqlc.narg(exclude_member_id)::uuid IS NULL OR m.id != sqlc.narg(exclude_member_id)::uuid)
  AND (
    sqlc.arg(allow_duplicates)::bool
    OR NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.member_id = m.id AND n.type = sqlc.arg(notif_type)
        AND n.link = sqlc.arg(link)
        AND n.from_author_id IS NOT DISTINCT FROM sqlc.narg(from_author_id)::uuid
    )
  );

-- name: ListAllMemberIDs :many
-- Every member id - used for the ALWAYS_ON settingType bucket, which
-- (per SUBSCRIPTION_SETTINGS_MAP) has no subscription_settings row
-- requirement at all.
SELECT id FROM members
WHERE (sqlc.narg(candidate_ids)::uuid[] IS NULL OR id = ANY(sqlc.narg(candidate_ids)::uuid[]))
  AND (sqlc.narg(exclude_member_id)::uuid IS NULL OR id != sqlc.narg(exclude_member_id)::uuid);

-- name: ListPushEnabledMemberIDs :many
SELECT member_id FROM subscription_settings
WHERE type = sqlc.arg(setting_type) AND push_notification = true
  AND member_id = ANY(sqlc.arg(member_ids)::uuid[]);

-- name: UpsertExpoToken :exec
INSERT INTO expo_tokens (member_id, expo_token) VALUES ($1, $2)
ON CONFLICT (expo_token) DO UPDATE SET member_id = EXCLUDED.member_id;

-- name: ListExpoTokensWithUnreadCount :many
SELECT et.expo_token,
       (SELECT count(*) FROM notifications n WHERE n.member_id = et.member_id AND n.read_at IS NULL) AS unread_count
FROM expo_tokens et
WHERE et.member_id = ANY(sqlc.arg(member_ids)::uuid[]);

-- name: GetSubscriptionSettingsForMember :many
SELECT id, member_id, type, push_notification FROM subscription_settings WHERE member_id = $1;

-- name: ReplaceSubscriptionSettings :exec
DELETE FROM subscription_settings WHERE member_id = $1;

-- name: InsertSubscriptionSetting :exec
INSERT INTO subscription_settings (member_id, type, push_notification) VALUES ($1, $2, $3);

-- name: GetSubscribedTagIDsForMember :many
SELECT "B" FROM _member_tag_subscriptions WHERE "A" = $1;

-- name: ReplaceSubscribedTags :exec
DELETE FROM _member_tag_subscriptions WHERE "A" = $1;

-- name: InsertSubscribedTag :exec
INSERT INTO _member_tag_subscriptions ("A", "B") VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: ListDefaultTagIDs :many
SELECT id FROM tags WHERE is_default = true;

-- name: ListNollningTagIDs :many
SELECT id FROM tags WHERE name_sv LIKE '[NOLLNING]%';

-- name: GetAdminSettings :many
SELECT key, value FROM admin_settings WHERE key = ANY(sqlc.arg(keys)::text[]);

-- name: ListTagsByIDs :many
-- Used by the Discord webhook to check for a NOLLNING-prefixed tag and pick
-- the embed's color/footer from the article's first tag.
SELECT id, name_sv, name_en, color FROM tags WHERE id = ANY(sqlc.arg(ids)::uuid[]);

-- name: GetMemberNameForNotification :one
-- Resolves a member's display name for message text the real Notifier
-- synthesizes itself (e.g. "X har gillat din nyhet") - mirrors getFullName's
-- inputs exactly (fullName in service.go is the Go port of getFullName).
SELECT first_name, nickname, last_name FROM members WHERE id = $1;
