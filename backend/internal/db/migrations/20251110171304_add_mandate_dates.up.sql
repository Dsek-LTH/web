-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "end_month" INTEGER NOT NULL DEFAULT 11,
ADD COLUMN     "start_month" INTEGER NOT NULL DEFAULT 0;
