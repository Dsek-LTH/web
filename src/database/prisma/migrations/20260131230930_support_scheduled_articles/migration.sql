-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "notification_text" VARCHAR(255),
ADD COLUMN     "scheduled_id" TEXT,
ADD COLUMN     "should_send_notification" BOOLEAN DEFAULT false;
