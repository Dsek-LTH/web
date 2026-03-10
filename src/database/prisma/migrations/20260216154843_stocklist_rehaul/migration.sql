/*
  Warnings:

  - You are about to drop the column `quantityIn` on the `drinkitembatch` table. All the data in the column will be lost.
  - You are about to drop the column `quantityOut` on the `drinkitembatch` table. All the data in the column will be lost.
  - Added the required column `quantity_delta` to the `drinkitembatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "drinkitem" ADD COLUMN     "quantity_available" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "drinkitembatch" DROP COLUMN "quantityIn",
DROP COLUMN "quantityOut",
ADD COLUMN     "quantity_delta" INTEGER NOT NULL;
