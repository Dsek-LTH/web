/*
  Warnings:

  - You are about to drop the column `image_url` on the `committees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "committees" DROP COLUMN "image_url",
ADD COLUMN     "dark_image_url" TEXT,
ADD COLUMN     "light_image_url" TEXT,
ADD COLUMN     "mono_image_url" TEXT,
ADD COLUMN     "symbol_url" TEXT;
