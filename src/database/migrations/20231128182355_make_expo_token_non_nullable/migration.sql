/*
  Warnings:

  - Made the column `expo_token` on table `expo_tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "expo_tokens" ALTER COLUMN "expo_token" SET NOT NULL;
