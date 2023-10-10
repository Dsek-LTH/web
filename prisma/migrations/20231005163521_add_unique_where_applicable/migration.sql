/*
  Warnings:

  - You are about to drop the column `articleId` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[api_name,role,student_id]` on the table `AccessPolicy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[articleId,memberId]` on the table `ArticleLike` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[memberId,mandateId]` on the table `Author` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[member_id,positionId,start,end]` on the table `Mandate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "articleId";

-- CreateIndex
CREATE UNIQUE INDEX "AccessPolicy_api_name_role_student_id_key" ON "AccessPolicy"("api_name", "role", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleLike_articleId_memberId_key" ON "ArticleLike"("articleId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Author_memberId_mandateId_key" ON "Author"("memberId", "mandateId");

-- CreateIndex
CREATE UNIQUE INDEX "Mandate_member_id_positionId_start_end_key" ON "Mandate"("member_id", "positionId", "start", "end");
