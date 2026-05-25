/*
  Warnings:

  - The values [DAYMANAGER] on the enum `time_slots` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `is_detatched` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `phadderInId` on the `mandates` table. All the data in the column will be lost.
  - You are about to drop the `drinkitem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drinkitembatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `phadder_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sexetinventoryvaluelog` table. If the table is not empty, all the data it contains will be lost.

*/

BEGIN;
CREATE TYPE "time_slots_new" AS ENUM ('DAYCARER', 'SHIFT_1', 'SHIFT_2', 'SHIFT_3');
ALTER TABLE "cafe_shifts" ALTER COLUMN "time_slot" TYPE "time_slots_new" USING (
    CASE "time_slot"::text
        WHEN 'DAYMANAGER' THEN 'DAYCARER'
        ELSE "time_slot"::text
    END::"time_slots_new"
);
ALTER TYPE "time_slots" RENAME TO "time_slots_old";
ALTER TYPE "time_slots_new" RENAME TO "time_slots";
DROP TYPE "time_slots_old";
COMMIT;

CREATE TABLE "drink_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quantity_type" "DrinkQuantityType" NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "group" "DrinkGroup" NOT NULL,
    "systembolaget_id" INTEGER NOT NULL,
    "bottle_empty_weight" INTEGER,
    "bottle_full_weight" INTEGER,
    "quantity_available" INTEGER DEFAULT 0,
    "nr_bottles" INTEGER DEFAULT 0,

    CONSTRAINT "drink_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drink_item_batch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "drink_item_id" UUID NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "nr_bottles_delta" INTEGER,

    CONSTRAINT "drink_item_batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mentor_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "image_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sexet_inventory_value_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "sexet_inventory_value_log_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "drinkitembatch" DROP CONSTRAINT "drinkitembatch_drink_item_id_fkey";
ALTER TABLE "mandates" DROP CONSTRAINT "mandates_phadderInId_fkey";
ALTER TABLE "members" DROP CONSTRAINT "members_nollning_group_id_foreign";

ALTER TABLE "events" RENAME COLUMN "is_detatched" TO "is_detached";
ALTER TABLE "mandates" RENAME COLUMN "phadderInId" TO "mentorInId";

INSERT INTO "drink_item" SELECT * FROM "drinkitem";
INSERT INTO "mentor_groups" SELECT * FROM "phadder_groups";
INSERT INTO "sexet_inventory_value_log" SELECT * FROM "sexetinventoryvaluelog";

INSERT INTO "drink_item_batch"
      ("id", "drink_item_id", "quantity_delta", "user", "date", "nr_bottles_delta")
SELECT "id", "drink_item_id", "quantity_delta", "user", "date", "nr_bottles_delta" FROM "drinkitembatch";

ALTER TABLE "drink_item_batch" ADD CONSTRAINT "drink_item_batch_drink_item_id_fkey" FOREIGN KEY ("drink_item_id") REFERENCES "drink_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_mentorInId_fkey" FOREIGN KEY ("mentorInId") REFERENCES "mentor_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "members" ADD CONSTRAINT "members_nollning_group_id_foreign" FOREIGN KEY ("nollning_group_id") REFERENCES "mentor_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

DROP TABLE "drinkitem";
DROP TABLE "drinkitembatch";
DROP TABLE "phadder_groups";
DROP TABLE "sexetinventoryvaluelog";
