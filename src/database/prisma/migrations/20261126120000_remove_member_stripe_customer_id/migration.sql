/*
  Warnings:

  - You are about to drop the column `stripe_customer_id` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "stripe_customer_id";
