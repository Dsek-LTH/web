import type { Member, Expense, ExpenseItem } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export type ExpandedExpenseForPdf = Expense & {
  member: Member;
  items: Array<
    ExpenseItem & {
      signer: Member;
      signedBy: Member | null;
    }
  >;
};

/**
 * Gathers all necessary data for creating a PDF of an expense.
 * This includes the expense itself, its items, and all related members.
 * Also verifies that all items are signed.
 */
export async function gatherExpenseDataForPdf(
  prisma: PrismaClient,
  expenseId: number,
): Promise<ExpandedExpenseForPdf> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      member: true,
      items: {
        include: {
          signer: true,
          signedBy: true,
        },
      },
    },
  });

  if (!expense) {
    throw new Error(`Expense ${expenseId} not found`);
  }

  // Verify all items are signed
  const unsignedItems = expense.items.filter((item) => !item.signedAt);
  if (unsignedItems.length > 0) {
    throw new Error("All items must be signed before sending to bookkeeping");
  }

  return expense;
}
