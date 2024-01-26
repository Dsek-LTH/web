/*
  Warnings:

  - You are about to alter the column `type` on the `authors` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "authors" ALTER COLUMN "type" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "policies" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
