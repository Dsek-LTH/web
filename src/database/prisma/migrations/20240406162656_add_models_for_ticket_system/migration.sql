-- CreateEnum
CREATE TYPE "ShoppableType" AS ENUM ('TICKET');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "externalCode" TEXT;

-- CreateTable
CREATE TABLE "shoppable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "type" "ShoppableType" NOT NULL,
    "authorId" UUID NOT NULL,
    "price" INTEGER NOT NULL,
    "available_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "available_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMPTZ(6),

    CONSTRAINT "shoppable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_question" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shoppableId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "type" VARCHAR(255) NOT NULL,
    "forExternalsOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_question_option" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "questionId" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "answerEn" TEXT,
    "extraPrice" INTEGER,

    CONSTRAINT "item_question_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_question_response" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "questionId" UUID NOT NULL,
    "consumableId" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "extraPrice" INTEGER,

    CONSTRAINT "item_question_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shoppableId" UUID NOT NULL,
    "memberId" UUID,
    "externalCustomerEmail" TEXT,
    "externalCustomerCode" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchased_at" TIMESTAMPTZ(6),
    "consumed_at" TIMESTAMPTZ(6),

    CONSTRAINT "consumable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shoppable" ADD CONSTRAINT "shoppable_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_id_fkey" FOREIGN KEY ("id") REFERENCES "shoppable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_question" ADD CONSTRAINT "item_question_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES "shoppable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_question_option" ADD CONSTRAINT "item_question_option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "item_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_question_response" ADD CONSTRAINT "item_question_response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "item_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_question_response" ADD CONSTRAINT "item_question_response_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "consumable"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consumable" ADD CONSTRAINT "consumable_shoppableId_fkey" FOREIGN KEY ("shoppableId") REFERENCES "shoppable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "consumable" ADD CONSTRAINT "consumable_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
