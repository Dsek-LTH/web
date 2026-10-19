-- AlterTable
ALTER TABLE "events" ADD COLUMN     "committee_id" UUID;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_committee_id_foreign" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
