/*
  Warnings:

  - Added the required column `date` to the `drinkitembatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user` to the `drinkitembatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "drinkitembatch" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user" TEXT NOT NULL;
