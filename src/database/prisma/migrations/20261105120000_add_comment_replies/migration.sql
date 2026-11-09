-- AlterTable
ALTER TABLE "article_comments" ADD COLUMN "parent_id" UUID;

-- AlterTable
ALTER TABLE "event_comments" ADD COLUMN "parent_id" UUID;

-- CreateIndex
CREATE INDEX "article_comments_parent_id_index" ON "article_comments"("parent_id");

-- CreateIndex
CREATE INDEX "event_comments_parent_id_index" ON "event_comments"("parent_id");

-- AddForeignKey
ALTER TABLE "article_comments" ADD CONSTRAINT "article_comments_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "article_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "event_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
