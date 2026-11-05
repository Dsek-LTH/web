-- name: ListCommitteesWithCounts :many
-- Full fields + currently-active mandate/unique-member counts, for the
-- committee overview page (mirrors the old "about" page's query).
SELECT c.id, c.name_sv, c.name_en, c.short_name, c.description_sv, c.description_en,
       c.dark_image_url, c.light_image_url, c.mono_image_url, c.symbol_url,
       c.banner_url, c.is_banner_text_light, c.preview_url,
       count(m.id) AS mandate_count,
       count(DISTINCT m.member_id) AS member_count
FROM committees c
LEFT JOIN positions p ON p.committee_id = c.id
LEFT JOIN mandates m ON m.position_id = p.id
    AND m.start_date <= CURRENT_DATE AND m.end_date >= CURRENT_DATE
GROUP BY c.id
ORDER BY c.name_sv;

-- name: GetCommitteeByShortName :one
-- Currently-active mandate/unique-member counts, same as
-- ListCommitteesWithCounts - the committee detail page shows these too.
SELECT c.id, c.name_sv, c.name_en, c.short_name, c.description_sv, c.description_en,
       c.dark_image_url, c.light_image_url, c.mono_image_url, c.symbol_url,
       c.banner_url, c.is_banner_text_light, c.preview_url,
       count(m.id) AS mandate_count,
       count(DISTINCT m.member_id) AS member_count
FROM committees c
LEFT JOIN positions p ON p.committee_id = c.id
LEFT JOIN mandates m ON m.position_id = p.id
    AND m.start_date <= CURRENT_DATE AND m.end_date >= CURRENT_DATE
WHERE c.short_name = $1
GROUP BY c.id;

-- name: UpdateCommittee :one
UPDATE committees
SET name_sv = $2, name_en = $3, description_sv = $4, description_en = $5,
    dark_image_url = $6, light_image_url = $7, mono_image_url = $8, symbol_url = $9,
    banner_url = $10, is_banner_text_light = $11, preview_url = $12
WHERE short_name = $1
RETURNING id, name_sv, name_en, short_name, description_sv, description_en,
          dark_image_url, light_image_url, mono_image_url, symbol_url,
          banner_url, is_banner_text_light, preview_url;
