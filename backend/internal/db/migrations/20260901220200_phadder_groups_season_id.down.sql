ALTER TABLE phadder_groups ADD COLUMN year INTEGER;

UPDATE phadder_groups g
SET year = s.year
FROM nollning_seasons s
WHERE s.id = g.season_id;

ALTER TABLE phadder_groups ALTER COLUMN year SET NOT NULL;
ALTER TABLE phadder_groups DROP COLUMN season_id;
