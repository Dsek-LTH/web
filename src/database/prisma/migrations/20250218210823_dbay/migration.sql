-- AlterTable
ALTER TABLE "mandates" ALTER COLUMN "last_synced" SET DEFAULT TIMESTAMP '1970-01-01 00:00:00';

-- CreateTable
CREATE TABLE "Dbay" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "header" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dbay_pkey" PRIMARY KEY ("id")
);
