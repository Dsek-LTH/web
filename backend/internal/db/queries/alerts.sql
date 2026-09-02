-- name: ListActiveAlerts :many
SELECT id, severity, message_sv, message_en, created_at, removed_at
FROM alerts
WHERE removed_at IS NULL
ORDER BY created_at DESC;

-- name: ListClosedAlertIDsForMember :many
SELECT "A" FROM _alerts_closed_by WHERE "B" = $1;

-- name: CreateAlert :one
INSERT INTO alerts (severity, message_sv, message_en)
VALUES ($1, $2, $3)
RETURNING id, severity, message_sv, message_en, created_at, removed_at;

-- name: SoftDeleteAlert :exec
UPDATE alerts SET removed_at = now() WHERE id = $1;

-- name: CloseAlertForMember :exec
INSERT INTO _alerts_closed_by ("A", "B") VALUES ($1, $2)
ON CONFLICT DO NOTHING;
