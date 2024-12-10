-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "isGuildCard" BOOLEAN NOT NULL,
    "memberId" UUID NOT NULL,
    "hasBeenSentToBookeeping" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expense_id" UUID NOT NULL,
    "committeeShortName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "costCenter" TEXT NOT NULL,
    "comment" TEXT,
    "receiptUrl" TEXT,
    "signerMemberId" UUID NOT NULL,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "expense_item_expense_id_foreign" FOREIGN KEY ("expense_id") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_committeeShortName_fkey" FOREIGN KEY ("committeeShortName") REFERENCES "committees"("short_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "expense_member_id_foreign" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "expense_item_signer_id_foreign" FOREIGN KEY ("signerMemberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
