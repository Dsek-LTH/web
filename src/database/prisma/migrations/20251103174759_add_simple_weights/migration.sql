/*
  Warnings:

  - You are about to drop the column `empty_bottle_weight` on the `drinkitem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "drinkitem" DROP COLUMN "empty_bottle_weight",
ADD COLUMN     "empty_weight" INTEGER;
