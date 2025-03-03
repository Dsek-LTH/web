import type { Member, Expense, ExpenseItem } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { generateExpensePdf } from "./generatePdf";
import { sendEmail } from "$lib/email/emailService";
import { env } from "$env/dynamic/private";
import dayjs from "dayjs";
import { getFullName } from "$lib/utils/client/member";

const { BOOKKEEPING_EMAIL } = env;

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

/**
 * Sends an expense to bookkeeping by:
 * 1. Generating a PDF
 * 2. Sending an email with the PDF attached
 * 3. Marking the expense as sent to bookkeeping
 */
export async function sendExpenseToBookkeeping(
  prisma: PrismaClient,
  expenseId: number,
): Promise<void> {
  if (BOOKKEEPING_EMAIL === undefined) {
    throw new Error("BOOKKEEPING_EMAIL is not set in the environment");
  }
  const expense = await gatherExpenseDataForPdf(prisma, expenseId);

  const pdfBytes = await generateExpensePdf(expense);

  const totalAmount = expense.items.reduce((sum, item) => sum + item.amount, 0);

  await sendEmail({
    to: BOOKKEEPING_EMAIL,
    subject: `Expense Report #${expense.id} - ${getFullName(expense.member)}`,
    text: `
Expense Report #${expense.id}
Member: ${getFullName(expense.member)}
Date: ${dayjs(expense.date).format("YYYY-MM-DD")}
Description: ${expense.description}
Total Amount: ${(totalAmount / 100).toFixed(2)} SEK
Type: ${expense.isGuildCard ? "Guild Card" : "Private Expense"}

Please find the detailed expense report attached.
    `,
    attachments: [
      {
        filename: `expense_${expense.id}_${dayjs(expense.date).format("YYYY-MM-DD")}.pdf`,
        content: pdfBytes,
      },
    ],
  });

  // Mark as sent to bookkeeping
  await prisma.expense.update({
    where: { id: expenseId },
    data: { hasBeenSentToBookkeeping: true },
  });
}
