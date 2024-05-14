-- CreateEnum
CREATE TYPE "recurringType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "is_detatched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurring_parent_id" UUID;

-- CreateTable
CREATE TABLE "RecurringEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "separation_count" INTEGER NOT NULL,
    "recurring_type" "recurringType" NOT NULL,
    "author_id" UUID NOT NULL,
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RecurringEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecurringEvent" ADD CONSTRAINT "events_author_id_foreign" FOREIGN KEY ("author_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "recurring_event_parent" FOREIGN KEY ("recurring_parent_id") REFERENCES "RecurringEvent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
