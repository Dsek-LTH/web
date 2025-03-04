/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Dbay` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Dbay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dbay" ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "mandates" ALTER COLUMN "last_synced" SET DEFAULT TIMESTAMP '1970-01-01 00:00:00';

-- CreateIndex
CREATE UNIQUE INDEX "dbay_slug_unique" ON "Dbay"("slug");
