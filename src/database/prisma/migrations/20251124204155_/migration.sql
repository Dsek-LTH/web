/*
  Warnings:

  - You are about to drop the column `quantity` on the `drinkitembatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "drinkitembatch" DROP COLUMN "quantity",
ADD COLUMN     "quantityIn" INTEGER,
ADD COLUMN     "quantityOut" INTEGER;
