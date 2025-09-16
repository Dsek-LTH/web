/*
  Warnings:

  - You are about to drop the column `can_send` on the `email_aliases` table. All the data in the column will be lost.
  - You are about to drop the `special_receivers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `special_senders` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "email_aliases" DROP COLUMN "can_send";

-- DropTable
DROP TABLE "special_receivers";

-- DropTable
DROP TABLE "special_senders";
