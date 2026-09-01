/*
  Warnings:

  - A unique constraint covering the columns `[short_name]` on the table `committees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "committees_short_name_key" ON "committees"("short_name");
