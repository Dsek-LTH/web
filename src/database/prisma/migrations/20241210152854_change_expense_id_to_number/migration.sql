/*
Warnings:

- The primary key for the `Expense` table will be changed. If it partially fails, the table could be left without primary key constraint.
- The `id` column on the `Expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
- Changed the type of `expense_id` on the `ExpenseItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

 */
-- DropForeignKey
DELETE FROM "ExpenseItem";

DELETE FROM "Expense";

ALTER TABLE "ExpenseItem"
DROP CONSTRAINT "expense_item_expense_id_foreign";

-- AlterTable
ALTER TABLE "Expense"
DROP CONSTRAINT "Expense_pkey",
DROP COLUMN "id",
ADD COLUMN "id" SERIAL NOT NULL,
ADD CONSTRAINT "Expense_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ExpenseItem"
DROP COLUMN "expense_id",
ADD COLUMN "expense_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "expense_item_expense_id_foreign" FOREIGN KEY ("expense_id") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;