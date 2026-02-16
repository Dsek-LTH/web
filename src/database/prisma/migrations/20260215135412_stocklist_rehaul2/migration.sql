/*
  Warnings:

  - You are about to drop the column `quantity_available` on the `drinkitembatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "drinkitem" ADD COLUMN     "quantity_available" INTEGER;

-- AlterTable
ALTER TABLE "drinkitembatch" DROP COLUMN "quantity_available";
