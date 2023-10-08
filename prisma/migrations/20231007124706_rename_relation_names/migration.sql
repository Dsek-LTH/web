/*
  Warnings:

  - You are about to drop the column `picture_path` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "picture_path",
ADD COLUMN     "picturePath" TEXT;
