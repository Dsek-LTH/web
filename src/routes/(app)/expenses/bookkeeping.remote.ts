import { command, getRequestEvent } from "$app/server";
import { sendExpenseToBookkeeping } from "$lib/expenses/sendToBookkeeping";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import z from "zod";

export const sendToBookkeeping = command(z.number(), async (id) => {
  const { locals } = getRequestEvent();
  const { prisma, user } = locals;

  if (!user?.memberId) {
    throw error(
      401,
      "Du måste vara inloggad för att skicka utlägg till bokföring",
    );
  }

  if (!isAuthorized(apiNames.EXPENSES.BOOKKEEPING, user)) {
    throw error(403, "Du har inte behörighet att skicka utlägg till bokföring");
  }

  try {
    await sendExpenseToBookkeeping(prisma, id);

    return redirect(
      "/expenses/all",
      {
        message: "Utlägg skickat till bokföring",
        type: "success",
      },
      getRequestEvent(),
    );
  } catch (e) {
    return {
      message: e instanceof Error ? e.message : "Ett fel uppstod",
      type: "error",
    };
  }
});
