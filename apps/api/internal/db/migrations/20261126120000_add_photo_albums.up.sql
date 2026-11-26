-- The photo gallery's albums (main's Prisma migrations
-- 20261020130000_add_photo_albums and 20261113233058_remove_album_image_count,
-- squashed). Production applied those under Prisma before the switch to Go,
-- so this is written to be a no-op there: adoptPrismaDatabase accepts a
-- Prisma history that includes them, and every statement here skips what
-- already exists. Table, constraint and index names match Prisma's.
CREATE TABLE IF NOT EXISTS "albums" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- A database that ran only the first of the two Prisma migrations.
ALTER TABLE "albums" DROP COLUMN IF EXISTS "image_count";

-- Prisma's implicit many-to-many tables: A is the album, B the member.
CREATE TABLE IF NOT EXISTS "_album_photographer" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_album_photographer_AB_pkey" PRIMARY KEY ("A", "B"),
    CONSTRAINT "_album_photographer_A_fkey" FOREIGN KEY ("A") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_album_photographer_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "_album_editor" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_album_editor_AB_pkey" PRIMARY KEY ("A", "B"),
    CONSTRAINT "_album_editor_A_fkey" FOREIGN KEY ("A") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_album_editor_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "_album_photographer_B_index" ON "_album_photographer"("B");
CREATE INDEX IF NOT EXISTS "_album_editor_B_index" ON "_album_editor"("B");
