-- name: ListAdminSettings :many
SELECT key, value, created_at, updated_at FROM admin_settings ORDER BY key ASC;

-- name: UpsertAdminSetting :one
INSERT INTO admin_settings (key, value, updated_at)
VALUES (sqlc.arg('key'), sqlc.arg('value'), CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET value = sqlc.arg('value'), updated_at = CURRENT_TIMESTAMP
RETURNING key, value, created_at, updated_at;

-- name: DeleteAdminSetting :execrows
DELETE FROM admin_settings WHERE key = sqlc.arg('key');
