-- name: GetMarkdown :one
SELECT name, markdown_sv, markdown_en FROM markdowns WHERE name = $1;

-- name: UpsertMarkdown :one
INSERT INTO markdowns (name, markdown_sv, markdown_en)
VALUES ($1, $2, $3)
ON CONFLICT (name) DO UPDATE SET markdown_sv = $2, markdown_en = $3
RETURNING name, markdown_sv, markdown_en;
