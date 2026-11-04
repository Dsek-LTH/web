-- name: DatabaseNow :one
-- The database's current time, for comparing with timestamps it set with
-- now() - the application's clock can be off from it.
SELECT now()::timestamptz AS now;
