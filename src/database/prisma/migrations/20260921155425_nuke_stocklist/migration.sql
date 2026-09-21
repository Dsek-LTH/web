/*
  Warnings:

  - You are about to drop the `drinkitem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drinkitembatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sexetinventoryvaluelog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "drinkitembatch" DROP CONSTRAINT "drinkitembatch_drink_item_id_fkey";

-- DropTable
DROP TABLE "drinkitem";

-- DropTable
DROP TABLE "drinkitembatch";

-- DropTable
DROP TABLE "sexetinventoryvaluelog";

-- DropEnum
DROP TYPE "DrinkGroup";

-- DropEnum
DROP TYPE "DrinkQuantityType";
