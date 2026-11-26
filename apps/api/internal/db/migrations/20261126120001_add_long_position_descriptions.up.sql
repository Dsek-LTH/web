-- main's Prisma migration 20261109170634_add_long_position_descriptions. A
-- no-op on a database Prisma already ran it on (see
-- 20261126120000_add_photo_albums).
ALTER TABLE "positions"
    ADD COLUMN IF NOT EXISTS "long_description_en" TEXT,
    ADD COLUMN IF NOT EXISTS "long_description_sv" TEXT;
