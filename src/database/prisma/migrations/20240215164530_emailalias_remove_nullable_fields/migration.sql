/*
  Warnings:

  - Made the column `position_id` on table `email_aliases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `email_aliases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `can_send` on table `email_aliases` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "email_aliases" ALTER COLUMN "position_id" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "can_send" SET NOT NULL;
