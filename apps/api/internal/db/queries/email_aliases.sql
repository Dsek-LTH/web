-- name: ListEmailAliasesForPosition :many
SELECT id, position_id, email FROM email_aliases WHERE position_id = $1 ORDER BY email;
