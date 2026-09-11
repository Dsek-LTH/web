-- Clear any stray "door" values that don't match a real door name so the new
-- foreign key below can be added (bookables.door was previously free text).
UPDATE "bookables" SET "door" = NULL WHERE "door" IS NOT NULL AND "door" NOT IN (SELECT "name" FROM "doors");

-- AlterTable
ALTER TABLE "door_access_policies" ADD COLUMN     "booking_request_id" UUID;

-- CreateTable
CREATE TABLE "_booking_requests_access_doors" (
    "A" UUID NOT NULL,
    "B" VARCHAR(255) NOT NULL,

    CONSTRAINT "_booking_requests_access_doors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_booking_requests_access_members" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_booking_requests_access_members_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_booking_requests_access_doors_B_index" ON "_booking_requests_access_doors"("B");

-- CreateIndex
CREATE INDEX "_booking_requests_access_members_B_index" ON "_booking_requests_access_members"("B");

-- AddForeignKey
ALTER TABLE "bookables" ADD CONSTRAINT "bookables_door_name_foreign" FOREIGN KEY ("door") REFERENCES "doors"("name") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "door_access_policies" ADD CONSTRAINT "door_access_policies_booking_request_id_foreign" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_booking_requests_access_doors" ADD CONSTRAINT "_booking_requests_access_doors_A_fkey" FOREIGN KEY ("A") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_booking_requests_access_doors" ADD CONSTRAINT "_booking_requests_access_doors_B_fkey" FOREIGN KEY ("B") REFERENCES "doors"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_booking_requests_access_members" ADD CONSTRAINT "_booking_requests_access_members_A_fkey" FOREIGN KEY ("A") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_booking_requests_access_members" ADD CONSTRAINT "_booking_requests_access_members_B_fkey" FOREIGN KEY ("B") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
