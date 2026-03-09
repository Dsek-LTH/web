/*
  Warnings:

  - You are about to drop the column `nrBottles` on the `drinkitembatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "drinkitem" ADD COLUMN     "nr_bottles" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "drinkitembatch" DROP COLUMN "nrBottles";
