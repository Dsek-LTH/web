-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "committee_id" UUID;

-- AlterTable
ALTER TABLE "committees" ADD COLUMN     "banner_url" TEXT,
ADD COLUMN     "is_banner_text_light" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preview_url" TEXT;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_committee_id_foreign" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
