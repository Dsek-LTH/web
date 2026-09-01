-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "image_url" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "committees" ALTER COLUMN "image_url" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "custom_authors" ALTER COLUMN "image_url" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "picture_path" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "product" ALTER COLUMN "image_url" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_inventory_item" ALTER COLUMN "image_url" SET DATA TYPE TEXT;
