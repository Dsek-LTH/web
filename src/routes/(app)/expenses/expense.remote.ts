import { command, form, getRequestEvent, query, requested } from "$app/server";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { redirect } from "sveltekit-flash-message/server";
import z from "zod";
import {
  expensesInclusion,
  extractFilter,
  whereGivenFilter,
} from "./getExpenses";
import { error } from "@sveltejs/kit";
import { updateItemSchema } from "./types";
import {
  getSigner,
  resolveSignerLogic,
  updateSignersCacheIfNecessary,
} from "./signers";
import { getCostCenter } from "./config";
import { sendNotificationToSigner } from "./helper";
import { convertPriceToCents } from "$lib/utils/convertPrice";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";

export const getFilteredExpenses = query(async () => {
  const { locals, url } = getRequestEvent();
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
    pageCount,
  };
});

export const getMyExpenses = query(async () => {
  const { locals } = getRequestEvent();
  const { prisma, user, member } = locals;

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
      AND: [
        {
          removedAt: null,
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

  if (
    !isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user) &&
    expensesToSign.length === 0 &&
    myExpenses.length === 0
  ) {
    // user has no relevant expenses to view, and they aren't part of the bookkeeping team either
    throw redirect(302, "/expenses/upload");
  }
  return {
    myExpenses,
    expensesToSign,
  };
});

export const getExpense = query(z.coerce.number(), async (id) => {
  const { locals } = getRequestEvent();
  const { prisma } = locals;

  const expense = await prisma.expense.findUnique({
    where: {
      id: id,
    },
    include: expensesInclusion,
  });
  if (!expense) {
    throw error(404, "Expense not found");
  }
  return expense;
});

export const getExpenseItem = query(z.uuid(), async (itemId) => {
  const { locals } = getRequestEvent();
  const { prisma, member } = locals;

  if (!member)
    throw error(401, "Du måste vara inloggad för att uppdatera utlägg");

  const expenseItem = await prisma.expenseItem.findUnique({
    where: { id: itemId },
  });

  return expenseItem;
});

export const updateReceipt = form(updateItemSchema, async (data, issue) => {
  const { locals } = getRequestEvent();
  const { prisma, member } = locals;

  console.log(data);
  console.log(issue);

  if (!member)
    throw error(401, "Du måste vara inloggad för att uppdatera utlägg");

  await updateSignersCacheIfNecessary();
  const before = await prisma.expenseItem.findUnique({
    where: { id: data.id },
    include: {
      expense: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!before) throw error(404, "Utlägget hittades inte");
  const costCenter = getCostCenter(data.costCenter ?? before?.costCenter);
  const signer = resolveSignerLogic(
    getSigner(costCenter.signer),
    before.expense.memberId,
    costCenter.name,
  );
  const expenseItem = await prisma.expenseItem.update({
    where: { id: data.id },
    data: {
      ...data,
      amount: convertPriceToCents(data.amount),
      committeeShortName: costCenter.committee,
      signerMemberId: signer,
    },
    include: {
      expense: {
        select: {
          id: true,
          description: true,
        },
      },
    },
  });
  if (signer !== before.signerMemberId) {
    await sendNotificationToSigner(before.expense.member, expenseItem.expense, [
      signer,
    ]);
  }
  void getExpense(expenseItem.expense.id).refresh();
  void getMyExpenses().refresh();
  void getFilteredExpenses().refresh();

  for (const { query } of requested(getExpense, 1)) {
    void query.refresh();
  }

  return {
    message: "Utlägg uppdaterat",
    type: "success",
  };
});

export const deleteExpense = command(z.number(), async (id) => {
  const { locals } = getRequestEvent();
  const { prisma } = locals;

  await prisma.expense.update({
    where: {
      id: id,
    },
    data: {
      removedAt: new Date(),
    },
  });

  void getMyExpenses().refresh();
  void getFilteredExpenses().refresh();

  return redirect(
    "/expenses",
    {
      message: "Utlägg borttaget",
      type: "success",
    },
    getRequestEvent(),
  );
});
