-- AlterTable
ALTER TABLE "mandates" ADD COLUMN     "phadderInId" UUID;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "nollning_group_id" UUID;

-- CreateTable
CREATE TABLE "phadder_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "phadder_groups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_phadderInId_fkey" FOREIGN KEY ("phadderInId") REFERENCES "phadder_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_nollning_group_id_foreign" FOREIGN KEY ("nollning_group_id") REFERENCES "phadder_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
