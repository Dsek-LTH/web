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
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const load = async ({ locals, params }) => {
  const { prisma } = locals;
  if (params.id.length === 0 || Number.isNaN(Number(params.id))) {
    throw error(404, "Expense id should be a number");
  }
  const expense = await prisma.expense.findUnique({
    where: {
      id: Number(params.id),
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

const approveReceiptSchema = z.object({
  itemId: z.string(),
});

export const actions = {
  update: async ({ params, request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateExpenseSchema));
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");

    if (!form.valid) return fail(400, { form });

    const { items, ...expenseData } = form.data;

    const expense = await prisma.expense.update({
      where: { id: Number(params.id) },
      data: {
        date: expenseData.date,
        description: expenseData.description,
        isGuildCard: expenseData.isGuildCard,
      },
    });

    const newItems = items.filter((item) => !item.itemId);
    const existingItems = items.filter((item) => !!item.itemId);

    try {
      await prisma.expenseItem.deleteMany({
        where: {
          expenseId: Number(params.id),
          id: {
            notIn: existingItems.map((item) => item.itemId!),
          },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2004") {
          // can't delete due to access
        }
      } else {
        throw e;
      }
    }

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
          // if user does not have access to update expenseItems, it will fail the update method
          // this can also happen for any of the other common database errors which can occur
          // we catch and throw like this to handle issues with Promise.all(...)
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
              expenseId: Number(params.id),
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
          // see comment above
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
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");
    await prisma.expense.update({
      where: {
        id: Number(params.id),
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
  approveReceipt: async (event) => {
    const { locals, params, request } = event;
    const { prisma, user } = locals;
    if (!user?.memberId)
      throw error(401, "Du måste vara inloggad för att godkänna utlägg");
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");
    const form = await superValidate(request, zod(approveReceiptSchema));
    if (!form.valid) return fail(400, { form });
    const canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
    await prisma.expenseItem.update({
      where: {
        id: form.data.itemId,
        expenseId: Number(params.id),
        signedByMemberId: null,
        signedAt: null,
        signerMemberId: canAlwaysSign ? undefined : user.memberId, // only sign items which are assigned to the user, or all if user is allowed to sign all (i.e. is the treasurer or president)
      },
      data: {
        signedByMemberId: user.memberId,
        signedAt: new Date(),
      },
    });
    return message(form, {
      message: "Kvitto godkänd",
      type: "success",
    });
  },
  approveAll: async (event) => {
    const { locals, params } = event;
    const { prisma, user } = locals;
    if (!user?.memberId)
      throw error(401, "Du måste vara inloggad för att godkänna utlägg");
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");
    const canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
    const result = await prisma.expenseItem.updateMany({
      where: {
        expenseId: Number(params.id),
        signedByMemberId: null,
        signedAt: null,
        signerMemberId: canAlwaysSign ? undefined : user.memberId, // only sign items which are assigned to the user, or all if user is allowed to sign all (i.e. is the treasurer or president)
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
