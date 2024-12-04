import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { error } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { getCostCenter } from "../config";
import { expensesInclusion } from "../getExpenses";
import {
  getSigner,
  resolveSignerLogic,
  updateSignersCacheIfNecessary,
} from "../signers";
import { updateExpenseSchema } from "../types";

export const load = async ({ locals, params }) => {
  const { prisma } = locals;
  const expense = await prisma.expense.findUnique({
    where: {
      id: params.id,
    },
    include: expensesInclusion,
  });
  if (!expense) {
    throw error(404, "Expense not found");
  }
  return {
    expense,
    updateForm: await superValidate(
      {
        ...expense,
        items: expense.items.map((item) => ({
          itemId: item.id,
          costCenter: item.costCenter,
          amount: item.amount,
          comment: item.comment,
        })),
      },
      zod(updateExpenseSchema),
    ),
  };
};

export const actions = {
  update: async ({ params, request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateExpenseSchema));

    if (!form.valid) return fail(400, { form });

    const { items, ...expenseData } = form.data;

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        date: expenseData.date,
        description: expenseData.description,
        isGuildCard: expenseData.isGuildCard,
      },
    });

    const newItems = items.filter((item) => !item.itemId);
    const existingItems = items.filter((item) => !!item.itemId);

    await prisma.expenseItem.deleteMany({
      where: {
        expenseId: params.id,
        id: {
          notIn: existingItems.map((item) => item.itemId!),
        },
      },
    });

    // Update the related expense items
    if (existingItems.length > 0) {
      const updateItemsPromises = await Promise.allSettled(
        existingItems.map((item) =>
          prisma.expenseItem.update({
            where: { id: item.itemId! },
            data: {
              costCenter: item.costCenter,
              committeeShortName: getCostCenter(item.costCenter).committee,
              amount: item.amount,
              comment: item.comment,
            },
          }),
        ),
      );
      for (const promiseResult of updateItemsPromises)
        if (promiseResult.status === "rejected") {
          console.error(`Failed to update expense item`, promiseResult.reason);
          throw promiseResult.reason;
        }
    }
    if (newItems.length > 0) {
      await updateSignersCacheIfNecessary();
      const newItemsPromises = await Promise.allSettled(
        newItems.map((item) =>
          prisma.expenseItem.create({
            data: {
              expenseId: params.id,
              costCenter: item.costCenter,
              committeeShortName: getCostCenter(item.costCenter).committee,
              amount: item.amount,
              comment: item.comment,
              signerMemberId: resolveSignerLogic(
                getSigner(item.costCenter),
                expense.memberId, // user who created the expense
                item.costCenter,
              ),
            },
          }),
        ),
      );
      for (const promiseResult of newItemsPromises)
        if (promiseResult.status === "rejected") {
          console.error(`Failed to create expense item`, promiseResult.reason);
          throw promiseResult.reason;
        }
    }

    return message(form, {
      message: "Utlägg uppdaterat",
      type: "success",
    });
  },
  delete: async (event) => {
    const { locals, params } = event;
    const { prisma } = locals;
    await prisma.expense.update({
      where: {
        id: params.id,
      },
      data: {
        removedAt: new Date(),
      },
    });
    return redirect(
      "/expenses",
      {
        message: "Utlägg borttaget",
        type: "success",
      },
      event,
    );
  },
  approve: async (event) => {
    const { locals, params } = event;
    const { prisma, user } = locals;
    if (!user?.memberId)
      throw error(401, "Du måste vara inloggad för att godkänna utlägg");
    const canSignAll = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
    const result = await prisma.expenseItem.updateMany({
      where: {
        expenseId: params.id,
        signedByMemberId: null,
        signedAt: null,
        signerMemberId: canSignAll ? undefined : user.memberId, // only sign items which are assigned to the user, or all if user is allowed to sign all (i.e. is the treasurer or president)
      },
      data: {
        signedByMemberId: user.memberId,
        signedAt: new Date(),
      },
    });
    if (result.count === 0) {
      throw error(400, "Utlägget kunde inte godkännas");
    }
    return redirect(
      "/expenses",
      {
        message: "Utlägg godkänt",
        type: "success",
      },
      event,
    );
  },
};
