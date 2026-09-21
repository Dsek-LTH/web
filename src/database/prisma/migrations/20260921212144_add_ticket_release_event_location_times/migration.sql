-- AlterTable
ALTER TABLE "ticket_release"
    ADD COLUMN "event_id" UUID,
    ADD COLUMN "location" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "closes_at" TIMESTAMPTZ(6),
    ADD COLUMN "expires_at" TIMESTAMPTZ(6);

-- Backfill closes_at/expires_at for any pre-existing rows so we can make
-- them NOT NULL below (there are none in production yet - this service is
-- brand new - but keep the migration correct regardless of dev DB state).
UPDATE "ticket_release" SET "closes_at" = "opens_at" + INTERVAL '7 days' WHERE "closes_at" IS NULL;
UPDATE "ticket_release" SET "expires_at" = "opens_at" + INTERVAL '30 days' WHERE "expires_at" IS NULL;

ALTER TABLE "ticket_release"
    ALTER COLUMN "event_id" SET NOT NULL,
    ALTER COLUMN "closes_at" SET NOT NULL,
    ALTER COLUMN "expires_at" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ticket_release" ADD CONSTRAINT "ticket_release_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
