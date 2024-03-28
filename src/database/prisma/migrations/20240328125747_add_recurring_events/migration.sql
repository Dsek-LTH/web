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
    "title" VARCHAR(255) NOT NULL,
    "title_en" VARCHAR(255),
    "description" TEXT NOT NULL,
    "description_en" TEXT,
    "link" VARCHAR(255),
    "location" VARCHAR(255),
    "organizer" VARCHAR(255) NOT NULL,
    "author_id" UUID NOT NULL,
    "short_description" VARCHAR(255) NOT NULL,
    "short_description_en" VARCHAR(255),
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6) NOT NULL,
    "number_of_updates" INTEGER DEFAULT 0,
    "slug" VARCHAR(255),
    "alarm_active" BOOLEAN DEFAULT false,

    CONSTRAINT "RecurringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_events_slug_unique" ON "RecurringEvent"("slug");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "recurring_event_parent" FOREIGN KEY ("recurring_parent_id") REFERENCES "RecurringEvent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
