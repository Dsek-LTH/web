-- AlterTable
ALTER TABLE "members" ADD COLUMN     "email" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
