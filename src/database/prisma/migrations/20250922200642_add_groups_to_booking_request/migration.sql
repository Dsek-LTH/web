-- CreateTable
CREATE TABLE "_BookingRequestToPosition" (
    "A" UUID NOT NULL,
    "B" VARCHAR(255) NOT NULL,

    CONSTRAINT "_BookingRequestToPosition_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BookingRequestToPosition_B_index" ON "_BookingRequestToPosition"("B");

-- AddForeignKey
ALTER TABLE "_BookingRequestToPosition" ADD CONSTRAINT "_BookingRequestToPosition_A_fkey" FOREIGN KEY ("A") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingRequestToPosition" ADD CONSTRAINT "_BookingRequestToPosition_B_fkey" FOREIGN KEY ("B") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
