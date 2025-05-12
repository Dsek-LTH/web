-- AlterTable
ALTER TABLE "mandates" ALTER COLUMN "last_synced" DROP DEFAULT,
ALTER COLUMN "last_synced" SET DATA TYPE DATE;
