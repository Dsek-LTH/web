import { Prisma } from "@prisma/client";

export const expensesInclusion = {
  member: {
    select: {
      firstName: true,
      lastName: true,
      picturePath: true,
    },
  },
  items: {
    include: {
      signer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          picturePath: true,
        },
      },
      signedBy: {
        select: {
          firstName: true,
          lastName: true,
          picturePath: true,
        },
      },
    },
    orderBy: {
      id: Prisma.SortOrder.desc,
    },
  },
} satisfies Prisma.ExpenseInclude;

export type ExpandedExpense = Prisma.ExpenseGetPayload<{
  include: typeof expensesInclusion;
}>;

const allowedFilters = ["all", "signed", "not-signed", "in-book"] as const;
type Filter = (typeof allowedFilters)[number];
export const extractFilter = (url: URL) => {
  const filter = url.searchParams.get("expense-filter");
  if (filter == null) return "all";
  if (!allowedFilters.includes(filter as Filter)) return "all";
  return filter as Filter;
};

export const whereGivenFilter = (filter: Filter): Prisma.ExpenseWhereInput => {
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
