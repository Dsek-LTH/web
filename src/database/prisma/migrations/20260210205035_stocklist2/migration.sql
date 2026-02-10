-- CreateEnum
CREATE TYPE "DrinkQuantityType" AS ENUM ('NONE', 'WEIGHT', 'COUNTS');

-- CreateEnum
CREATE TYPE "DrinkGroup" AS ENUM ('S1', 'S2', 'S3', 'S4');

-- CreateTable
CREATE TABLE "drinkitem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quantity_type" "DrinkQuantityType" NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "group" "DrinkGroup" NOT NULL,
    "systembolaget_id" INTEGER NOT NULL,
    "bottle_empty_weight" INTEGER,
    "bottle_full_weight" INTEGER,

    CONSTRAINT "drinkitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drinkitembatch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drink_item_id" UUID NOT NULL,
    "quantityIn" INTEGER,
    "quantityOut" INTEGER,
    "user" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nrBottles" INTEGER,

    CONSTRAINT "drinkitembatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sexetinventoryvaluelog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "sexetinventoryvaluelog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "drinkitembatch" ADD CONSTRAINT "drinkitembatch_drink_item_id_fkey" FOREIGN KEY ("drink_item_id") REFERENCES "drinkitem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
