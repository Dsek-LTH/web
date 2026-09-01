-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('POLICY', 'GUIDELINE', 'MEETING', 'OTHER');

-- AlterTable
ALTER TABLE "governing_documents" RENAME TO "documents";
ALTER TABLE "documents" RENAME COLUMN "document_type" TO "type";
ALTER TABLE "documents" RENAME CONSTRAINT "governing_documents_pkey" TO "documents_pkey";
ALTER TABLE "documents" ALTER COLUMN "type" TYPE "document_type" USING ("type"::text::"document_type");
ALTER TABLE "documents" ALTER COLUMN "type" SET NOT NULL;

-- DropEnum
DROP TYPE "governing_document_type";

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "url" VARCHAR(255) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meetings_url_key" ON "meetings"("url");