/*
  Warnings:

  - Made the column `slug` on table `articles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "committees" ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "description_en" VARCHAR(255),
ADD COLUMN     "image_url" VARCHAR(255);
