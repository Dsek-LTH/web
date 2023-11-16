-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "type" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "start" TIMESTAMPTZ(6),
    "end" TIMESTAMPTZ(6),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_agenda_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meeting_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL DEFAULT 0,
    "concluded" BOOLEAN DEFAULT false,
    "comment" VARCHAR(255),

    CONSTRAINT "meeting_agenda_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_meeting_id_foreign" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterTable
ALTER TABLE "meeting_agenda_items" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "concluded" SET NOT NULL;

-- CreateTable
CREATE TABLE "MeetingAttachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meetingAgendaItemId" UUID,
    "file_url" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "meetingId" UUID,

    CONSTRAINT "MeetingAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MeetingAttachment" ADD CONSTRAINT "MeetingAttachment_meetingAgendaItemId_fkey" FOREIGN KEY ("meetingAgendaItemId") REFERENCES "meeting_agenda_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttachment" ADD CONSTRAINT "MeetingAttachment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "meetings" ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "start" SET NOT NULL,
ALTER COLUMN "end" SET NOT NULL;
