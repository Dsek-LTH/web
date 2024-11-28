import { error, type Actions } from "@sveltejs/kit";
import { expensesInclusion } from "../getExpenses";

const extractNumberParam = (url: URL, param: string, defaultValue: number) => {
  const value = url.searchParams.get(param);
  if (value == null) return defaultValue;
  const parsed = parseInt(value);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
};

export const load = async ({ locals, url }) => {
  const { prisma, member } = locals;
  const page = extractNumberParam(url, "page", 0);
  const pageSize = extractNumberParam(url, "pageSize", 10);
  if (!member) throw error(401, "You must be logged in to handle expenses");

  const allExpenses = await prisma.expense.findMany({
    orderBy: {
      date: "desc",
    },
    include: expensesInclusion,
    take: pageSize,
    skip: page * pageSize,
  });
  const allExpensesCount = await prisma.expense.count();
  return {
    allExpenses,
    pageCount: Math.ceil(allExpensesCount / pageSize),
  };
};

export const actions: Actions = {};
