import { type Actions } from "@sveltejs/kit";
import { expensesInclusion } from "../getExpenses";
import type { Prisma } from "@prisma/client";
import {
  getIntegerParamOrThrowSvelteError,
  getPageOrThrowSvelteError,
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
        hasBeenSentToBookeeping: false,
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
        hasBeenSentToBookeeping: true,
      };
  }
};

export const load = async ({ locals, url }) => {
  const { prisma } = locals;
  const page = getPageOrThrowSvelteError(url, {
    fallbackValue: 0,
    lowerBound: 0,
  });
  const pageSize = getIntegerParamOrThrowSvelteError(url, "pageSize", {
    fallbackValue: 10,
    lowerBound: 1,
    upperBound: Number.MAX_SAFE_INTEGER,
    errorMessage: "Invalid page size",
  });
  const filter = extractFilter(url);

  const allExpenses = await prisma.expense.findMany({
    where: whereGivenFilter(filter),
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
