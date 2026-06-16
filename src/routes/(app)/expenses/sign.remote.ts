import { command, getRequestEvent } from "$app/server";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";
import z from "zod";
import {
  getExpense,
  getFilteredExpenses,
  getMyExpenses,
} from "./expense.remote";
import * as m from "$paraglide/messages";

export const approveAll = command(z.number(), async (id) => {
  const { locals } = getRequestEvent();
  const { prisma, user } = locals;
  if (!user?.memberId) throw error(401, m.expense_error_logged_in_sign());
  const canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
  const result = await prisma.expenseItem.updateMany({
    where: {
      expenseId: id,
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
    throw error(400, m.expense_error_approving());
  }

  void getExpense(id).refresh();
  void getMyExpenses().refresh();
  void getFilteredExpenses().refresh();

  return {
    message: m.expense_was_approved(),
    type: "success",
  };
});

export const unapproveReceipt = command(
  z.object({
    itemId: z.string(),
    expenseId: z.number(),
  }),
  async (data) => {
    const { locals } = getRequestEvent();
    const { prisma, user } = locals;
    if (!user?.memberId)
      return {
        message: m.expense_error_logged_in_unapprove(),
        type: "error",
      };

    const canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
    try {
      await prisma.expenseItem.update({
        where: {
          id: data.itemId,
          OR: canAlwaysSign
            ? undefined
            : [
                {
                  signedByMemberId: user.memberId,
                },
                {
                  signerMemberId: user.memberId,
                },
              ],
          signedAt: {
            not: null,
          },
        },
        data: {
          signedByMemberId: null,
          signedAt: null,
        },
      });
    } catch {
      return {
        message: m.expense_error_unapproving(),
        type: "error",
      };
    }

    void getExpense(data.expenseId).refresh();
    void getMyExpenses().refresh();
    void getFilteredExpenses().refresh();

    return {
      message: m.expense_was_unapproved(),
      type: "success",
    };
  },
);

export const approveReceipt = command(
  z.object({
    itemId: z.string(),
    expenseId: z.number(),
  }),
  async (data) => {
    const { locals } = getRequestEvent();
    const { prisma, user } = locals;
    if (!user?.memberId) throw error(401, m.expense_error_logged_in_sign());

    const canAlwaysSign = isAuthorized(apiNames.EXPENSES.CERTIFICATION, user);
    try {
      await prisma.expenseItem.update({
        where: {
          id: data.itemId,
          expenseId: data.expenseId,
          signedByMemberId: null,
          signedAt: null,
          signerMemberId: canAlwaysSign ? undefined : user.memberId, // only sign items which are assigned to the user, or all if user is allowed to sign all (i.e. is the treasurer or president)
        },
        data: {
          signedByMemberId: user.memberId,
          signedAt: new Date(),
        },
      });
    } catch {
      return {
        message: m.expense_error_receipt(),
        type: "error",
      };
    }

    void getExpense(data.expenseId).refresh();
    void getMyExpenses().refresh();
    void getFilteredExpenses().refresh();

    return {
      message: m.expense_receipt_was_approved(),
      type: "success",
    };
  },
);
