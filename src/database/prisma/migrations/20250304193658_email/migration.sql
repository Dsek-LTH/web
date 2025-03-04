/*
  Warnings:

  - Added the required column `email` to the `Dbay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Dbay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dbay" ADD COLUMN     "email" VARCHAR(255) NOT NULL,
ADD COLUMN     "phone" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "mandates" ALTER COLUMN "last_synced" SET DEFAULT TIMESTAMP '1970-01-01 00:00:00';
