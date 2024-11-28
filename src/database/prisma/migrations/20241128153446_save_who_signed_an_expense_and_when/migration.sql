/*
  Warnings:

  - You are about to drop the column `isCertified` on the `ExpenseItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExpenseItem" DROP COLUMN "isCertified",
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedByMemberId" UUID;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "expense_item_signed_by_member_id_foreign" FOREIGN KEY ("signedByMemberId") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
