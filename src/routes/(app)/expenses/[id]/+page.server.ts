import { redirect } from "sveltekit-flash-message/server";
import { error } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
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
    updateItemForm: await superValidate(zod4(updateItemSchema)),
    updateForm: await superValidate(expense, zod4(updateExpenseSchema)),
  };
};

export const actions = {
  updateReceipt: async ({ params, request, locals }) => {
    const { prisma, member } = locals;
    const form = await superValidate(request, zod4(updateItemSchema));
    if (params.id.length === 0 || Number.isNaN(Number(params.id)))
      throw error(404, "Expense id should be a number");

    if (!form.valid) return fail(400, { form });
    if (!member)
      throw error(401, "Du måste vara inloggad för att uppdatera utlägg");

    const data = form.data;
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
            description: true,
          },
        },
      },
    });
    if (signer !== before.signerMemberId) {
      await sendNotificationToSigner(
        before.expense.member,
        expenseItem.expense,
        [signer],
      );
    }

    return message(form, {
      message: "Utlägg uppdaterat",
      type: "success",
    });
  },
  update: async ({ params, request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(updateExpenseSchema));
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
};
