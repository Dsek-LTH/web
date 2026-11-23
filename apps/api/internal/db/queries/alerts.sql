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

-- name: SoftDeleteAlert :execrows
UPDATE alerts SET removed_at = now() WHERE id = $1 AND removed_at IS NULL;

-- name: CloseAlertForMember :execrows
-- Affects no rows for an alert that doesn't exist (or was removed), and
-- for one the member already closed - the service tells those apart.
INSERT INTO _alerts_closed_by ("A", "B")
SELECT a.id, sqlc.arg('member_id') FROM alerts a
WHERE a.id = sqlc.arg('alert_id')
ON CONFLICT DO NOTHING;

-- name: AlertExists :one
SELECT EXISTS (SELECT 1 FROM alerts WHERE id = $1);
