/*
 Warnings:
 
 - A unique constraint covering the columns `[slug]` on the table `songs` will be added. If there are existing duplicate values, this will fail.
 - Added the required column `slug` to the `songs` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE "songs"
ADD COLUMN "deleted_at" TIMESTAMPTZ(6),
  ADD COLUMN "slug" VARCHAR(255);

-- Update
CREATE EXTENSION "unaccent";
-- 1. trim trailing and leading whitespaces from text
-- 2. remove accents (diacritic signs) from a given text
-- 3. lowercase unaccented text
-- 4. remove single and double quotes
-- 5. replace non-alphanumeric (excluding hyphen, underscore) with a hyphen
-- 6. trim leading and trailing hyphens
-- Source: https://gist.github.com/abn/779166b0c766ce67351c588489831852 
-- and https://gist.github.com/kez/17638bade0382f820280dafa46277435
UPDATE "songs"
SET "slug" = trim(
    BOTH '-'
    FROM regexp_replace(
        regexp_replace(
          lower(unaccent(trim("title"))),
          '[''"]+',
          '',
          'gi'
        ),
        '[^a-z0-9\\-_]+',
        '-',
        'gi'
      )
  );
DROP EXTENSION "unaccent";

-- handle duplicates by incrementing slug, e.g. "my-song" -> "my-song-2"
WITH "duplicates" AS (
  SELECT id,
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY slug
      ORDER BY created_at
    ) as row_num
  FROM songs
)
UPDATE "songs"
SET slug = CONCAT(songs.slug, '-', duplicates.row_num)
FROM "duplicates"
WHERE songs.id = duplicates.id
  and duplicates.row_num > 1;

-- AlterTable
ALTER TABLE "songs"
ALTER COLUMN "slug"
SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "songs_slug_unique" ON "songs"("slug");