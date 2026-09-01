-- CreateTable
CREATE TABLE "elections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "committee_id" UUID NOT NULL,
    "markdown" TEXT NOT NULL,
    "markdown_en" TEXT,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_committee_id_foreign" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
