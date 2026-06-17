import { command, getRequestEvent } from "$app/server";
import { sendExpenseToBookkeeping } from "$lib/expenses/sendToBookkeeping";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";
import z from "zod";
import * as m from "$paraglide/messages";
import {
  getExpense,
  getMyExpenses,
  getFilteredExpenses,
} from "./expense.remote";

export const sendToBookkeeping = command(z.number(), async (id) => {
  const { locals } = getRequestEvent();
  const { prisma, user } = locals;

  if (!user?.memberId) {
    throw error(401, m.expense_error_logged_in_bookkeeping());
  }

  if (!isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user)) {
    throw error(403, m.expense_error_permission());
  }

  try {
    await sendExpenseToBookkeeping(prisma, id);

    void getExpense(id).refresh();
    void getMyExpenses().refresh();
    void getFilteredExpenses().refresh();

    return {
      message: m.expense_sent(),
      type: "success",
    };
  } catch (e) {
    return {
      message: e instanceof Error ? e.message : m.expense_errorOccurred(),
      type: "error",
    };
  }
});
