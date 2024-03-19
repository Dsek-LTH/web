-- Add column
ALTER TABLE "doors" ADD COLUMN "verbose_name" VARCHAR(255);

-- Set values for existing values
UPDATE "doors" SET verbose_name = 'Border (caféförrådet)'     WHERE "name" = 'border';
UPDATE "doors" SET verbose_name = 'Fulförrådet'               WHERE "name" = 'ful';
UPDATE "doors" SET verbose_name = 'Buren'                     WHERE "name" = 'buren';
UPDATE "doors" SET verbose_name = 'iDét'                      WHERE "name" = 'idet';
UPDATE "doors" SET verbose_name = 'Köket'                     WHERE "name" = 'koket';
UPDATE "doors" SET verbose_name = 'Komitea'                   WHERE "name" = 'komitea';
UPDATE "doors" SET verbose_name = 'Mauer (caféförrådet)'      WHERE "name" = 'mauer';
UPDATE "doors" SET verbose_name = 'Sexförrådet'               WHERE "name" = 'sex';
UPDATE "doors" SET verbose_name = 'Städförrådet'              WHERE "name" = 'stad';
UPDATE "doors" SET verbose_name = 'Råsenbad (styrelserummet)' WHERE "name" = 'styrelserummet';
UPDATE "doors" SET verbose_name = 'Utskott'                   WHERE "name" = 'utskott';

-- Impose not null constraint
ALTER TABLE "doors" ALTER COLUMN "verbose_name" SET NOT NULL;
