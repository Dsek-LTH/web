import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { error } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { getCostCenter } from "../config";
import { expensesInclusion } from "../getExpenses";
import { sendNotificationToSigner } from "../helper";
import {
  getSigner,
  resolveSignerLogic,
  updateSignersCacheIfNecessary,
} from "../signers";
import { updateExpenseSchema, updateItemSchema } from "../types";

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
    updateItemForm: await superValidate(zod(updateItemSchema)),
    updateForm: await superValidate(expense, zod(updateExpenseSchema)),
  };
};

const approveReceiptSchema = z.object({
  itemId: z.string(),
});

export const actions = {
  updateReceipt: async ({ params, request, locals }) => {
    const { prisma, member } = locals;
    const form = await superValidate(request, zod(updateItemSchema));
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");

    if (!form.valid) return fail(400, { form });
    if (!member)
      throw error(401, "Du måste vara inloggad för att uppdatera utlägg");

    const data = form.data;
    await updateSignersCacheIfNecessary();
    const before = await prisma.expenseItem.findUnique({
      where: { id: data.id },
    });
    if (!before) throw error(404, "Utlägget hittades inte");
    const costCenter = getCostCenter(data.costCenter ?? before?.costCenter);
    const signer = resolveSignerLogic(
      getSigner(costCenter.signer),
      member.id,
      costCenter.name,
    );
    const expenseItem = await prisma.expenseItem.update({
      where: { id: data.id },
      data: {
        ...data,
        committeeShortName: costCenter.committee,
        signerMemberId: signer,
      },
      include: {
        expense: {
          select: {
            description: true,
          },
        },
      },
    });
    if (signer !== before.signerMemberId) {
      await sendNotificationToSigner(member, expenseItem.expense, [signer]);
    }

    return message(form, {
      message: "Utlägg uppdaterat",
      type: "success",
    });
  },
  update: async ({ params, request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateExpenseSchema));
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");

    if (!form.valid) return fail(400, { form });

    const expenseData = form.data;

    await prisma.expense.update({
      where: { id: Number(params.id) },
      data: {
        date: expenseData.date,
        description: expenseData.description,
        isGuildCard: expenseData.isGuildCard,
      },
    });

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
