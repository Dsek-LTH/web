/*
  Warnings:

  - A unique constraint covering the columns `[questionId,consumableId]` on the table `item_question_response` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "item_question" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "item_question_response_question_id_consumable_id_unique" ON "item_question_response"("questionId", "consumableId");
