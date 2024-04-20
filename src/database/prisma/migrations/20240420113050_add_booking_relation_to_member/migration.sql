-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_booker_id_foreign" FOREIGN KEY ("booker_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
