-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "isGuildCard" BOOLEAN NOT NULL,
    "hasBeenSentToBookeeping" BOOLEAN NOT NULL DEFAULT false,
    "memberId" UUID NOT NULL,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expense_id" INTEGER NOT NULL,
    "committeeShortName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "costCenter" TEXT NOT NULL,
    "comment" TEXT,
    "receiptUrl" TEXT,
    "signerMemberId" UUID NOT NULL,
    "signedByMemberId" UUID,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expense_member_id_foreign" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_item_expense_id_foreign" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_committeeShortName_fkey" FOREIGN KEY ("committeeShortName") REFERENCES "committees"("short_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_item_signer_id_foreign" FOREIGN KEY ("signerMemberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_item_signed_by_member_id_foreign" FOREIGN KEY ("signedByMemberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
