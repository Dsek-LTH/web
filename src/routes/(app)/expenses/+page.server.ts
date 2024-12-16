import { redirect } from "$lib/utils/redirect";
import { error } from "@sveltejs/kit";
import { expensesInclusion } from "./getExpenses";

export const load = async ({ locals }) => {
  const { prisma, member } = locals;
  if (!member) throw error(401, "You must be logged in to handle expenses");

  const allExpenses = await prisma.expense.findMany({
    where: {
      // should be no overlap, you cannot sign your own expense
      OR: [
        {
          memberId: member.id,
        },
        {
          items: {
            some: {
              signerMemberId: member.id,
              signedAt: null,
            },
          },
        },
      ],
    },
    orderBy: {
      date: "desc",
    },
    include: expensesInclusion,
  });
  const expensesToSign = allExpenses.filter((e) =>
    e.items.some((i) => i.signerMemberId === member.id),
  );
  const myExpenses = allExpenses.filter((e) => e.memberId === member.id);

  if (expensesToSign.length === 0 && myExpenses.length === 0) {
    throw redirect(302, "/expenses/upload");
  }
  return {
    myExpenses,
    expensesToSign,
  };
};

export type ExpandedExpense = Awaited<
  ReturnType<typeof load>
>["myExpenses"][number];
