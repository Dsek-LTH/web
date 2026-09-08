/*
  Warnings:

  - You are about to drop the `RecurringEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RecurringEvent" DROP CONSTRAINT "events_author_id_foreign";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "recurring_event_parent";

-- DropTable
DROP TABLE "RecurringEvent";

-- CreateTable
CREATE TABLE "recurring_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "separation_count" INTEGER NOT NULL,
    "recurring_type" "recurringType" NOT NULL,
    "author_id" UUID NOT NULL,
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recurring_event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recurring_event" ADD CONSTRAINT "events_author_id_foreign" FOREIGN KEY ("author_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "recurring_event_parent" FOREIGN KEY ("recurring_parent_id") REFERENCES "recurring_event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
