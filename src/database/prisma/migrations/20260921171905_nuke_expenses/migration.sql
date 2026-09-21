/*
  Warnings:

  - You are about to drop the `expense_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expenses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "expense_items" DROP CONSTRAINT "expense_item_expense_id_foreign";

-- DropForeignKey
ALTER TABLE "expense_items" DROP CONSTRAINT "expense_item_signed_by_member_id_foreign";

-- DropForeignKey
ALTER TABLE "expense_items" DROP CONSTRAINT "expense_item_signer_id_foreign";

-- DropForeignKey
ALTER TABLE "expense_items" DROP CONSTRAINT "expense_items_committeeShortName_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expense_member_id_foreign";

-- DropTable
DROP TABLE "expense_items";

-- DropTable
DROP TABLE "expenses";
