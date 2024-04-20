-- AlterTable
ALTER TABLE "consumable" ADD COLUMN     "expires_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "maxAmountPerUser" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "consumable_reservation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shoppableId" UUID NOT NULL,
    "memberId" UUID,
    "externalCustomerEmail" TEXT,
    "externalCustomerCode" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER,

    CONSTRAINT "consumable_reservation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consumable_reservation" ADD CONSTRAINT "consumable_reservation_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES "shoppable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consumable_reservation" ADD CONSTRAINT "consumable_reservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
