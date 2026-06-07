import { command, getRequestEvent } from "$app/server";
import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { error, fail } from "@sveltejs/kit";
import z from "zod";

export const approveAll = command(z.number(), async (id) => {
  const { locals } = getRequestEvent();
  const { prisma, user } = locals;
  if (!user?.memberId)
    throw error(401, "Du måste vara inloggad för att godkänna utlägg");
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
    throw error(400, "Utlägget kunde inte godkännas");
  }
  return {
    message: "Utlägg godkänt",
    type: "success",
  };
});

export const disapproveReceipt = command(
  z.object({
    itemId: z.string(),
  }),
  async (data) => {
    const { locals } = getRequestEvent();
    const { prisma, user } = locals;
    if (!user?.memberId)
      throw fail(401, {
        fail,
        message: "Du måste vara inloggad för att av-godkänna utlägg",
      });

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
        message: "Kunde inte av-godkänna kvitto",
        type: "error",
      };
    }
    return {
      message: "Kvitto av-godkänt",
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
    if (!user?.memberId)
      throw error(401, "Du måste vara inloggad för att godkänna utlägg");

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
        message: "Kunde inte godkänna kvitto",
        type: "error",
      };
    }
    return {
      message: "Kvitto godkänd",
      type: "success",
    };
  },
);
