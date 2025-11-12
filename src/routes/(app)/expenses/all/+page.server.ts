import type { Actions } from "@sveltejs/kit";
import { expensesInclusion } from "../getExpenses";
import type { Prisma } from "@prisma/client";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";

const allowedFilters = ["all", "signed", "not-signed", "in-book"] as const;
type Filter = (typeof allowedFilters)[number];
const extractFilter = (url: URL) => {
  const filter = url.searchParams.get("expense-filter");
  if (filter == null) return "all";
  if (!allowedFilters.includes(filter as Filter)) return "all";
  return filter as Filter;
};

const whereGivenFilter = (filter: Filter): Prisma.ExpenseWhereInput => {
  switch (filter) {
    case "all":
      return {};
    case "signed":
      return {
        hasBeenSentToBookkeeping: false,
        items: {
          // If it has no items (for some reason), it will count as signed
          none: {
            signedAt: null,
          },
        },
      };
    case "not-signed":
      return {
        items: {
          some: {
            signedAt: null,
          },
        },
      };
    case "in-book":
      return {
        hasBeenSentToBookkeeping: true,
      };
  }
};

export const load = async ({ locals, url }) => {
  const { prisma } = locals;
  const allExpensesCount = await prisma.expense.count();

  const pageSize = getPageSizeOrThrowSvelteError(url);
  const pageCount = Math.max(Math.ceil(allExpensesCount / pageSize), 1);
  const page = getPageOrThrowSvelteError(url, {
    fallbackValue: 1,
    lowerBound: 1,
    upperBound: pageCount,
  });
  const filter = extractFilter(url);

  const allExpenses = await prisma.expense.findMany({
    where: whereGivenFilter(filter),
    orderBy: {
      date: "desc",
    },
    include: expensesInclusion,
    take: pageSize,
    skip: Math.max(page - 1, 0) * pageSize,
  });
  return {
    allExpenses,
  };
};

export const actions: Actions = {};
