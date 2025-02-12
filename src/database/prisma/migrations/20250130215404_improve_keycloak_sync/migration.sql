/*
  Warnings:

  - You are about to drop the column `in_keycloak` on the `mandates` table. All the data in the column will be lost.
  - You are about to drop the `last_keycloak_update` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "mandates" DROP COLUMN "in_keycloak",
ADD COLUMN     "last_synced" TIMESTAMP(3) NOT NULL DEFAULT TIMESTAMP '1970-01-01 00:00:00';

-- DropTable
DROP TABLE "last_keycloak_update";
