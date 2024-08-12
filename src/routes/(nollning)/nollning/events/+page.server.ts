import {
  addTicketToCart,
  AddToCartStatus,
  type AddToCartResult,
} from "$lib/server/shop/addToCart/addToCart.js";
import { getEventsWithTickets } from "$lib/server/shop/getTickets.js";
import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import { redirect } from "$lib/utils/redirect.js";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { fail, message, superValidate, type Infer } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";

const weekStarts = [
  "2024-08-26",
  "2024-09-02",
  "2024-09-09",
  "2024-09-16",
  "2024-09-23",
  "2024-09-30",
];

const getWeekInterval = (week: number) => {
  const weekStart = new Date(weekStarts[week]!);
  const weekEnd = new Date(weekStart.valueOf() + 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
};

const getCurrentWeek = () => {
  const now = new Date();
  for (let i = 0; i < weekStarts.length; i++) {
    const { weekStart, weekEnd } = getWeekInterval(i);
    if (now >= weekStart && now < weekEnd) {
      return i;
    }
  }
  return 0;
};

export const load = async ({ locals, url, depends }) => {
  const { prisma } = locals;
  if (!locals.user.memberId && !locals.user.externalCode) {
    return error(401);
  }

  const week = Number.parseInt(
    url.searchParams.get("week") ?? getCurrentWeek().toString(),
  );
  // check if week is a number, and between 0 and weekStarts.length
  if (Number.isNaN(week) || week < 0 || week >= weekStarts.length) {
    return error(400, "Invalid week parameter");
  }
  const { weekStart, weekEnd } = getWeekInterval(week);

  const identification = locals.user.memberId
    ? {
        memberId: locals.user.memberId,
      }
    : {
        externalCode: locals.user.externalCode!,
      };
  depends("tickets");
  const events = await getEventsWithTickets(prisma, identification, {
    startDatetime: {
      gte: weekStart,
    },
    endDatetime: {
      lte: weekEnd,
    },
  });

  return {
    week,
    events: events,
    weeks: weekStarts.length,
  };
};

const addToCartSchema = z.object({
  ticketId: z.string().uuid(),
});
export type AddToCartSchema = Infer<typeof addToCartSchema>;

export const actions = {
  addToCart: async (event) => {
    const { locals, request } = event;
    const { prisma, user } = locals;
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    const form = await superValidate(request, zod(addToCartSchema));
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return fail(401, { form });
    }
    let result: AddToCartResult;
    try {
      result = await addTicketToCart(
        prisma,
        form.data.ticketId,
        user.memberId
          ? {
              memberId: user.memberId,
            }
          : {
              externalCode: user.externalCode!, // guaranteed by guard above
            },
      );
    } catch (err) {
      let errorMsg;
      if (err instanceof Error) errorMsg = err.message;
      else errorMsg = String(err);
      return message(form, {
        message: errorMsg,
        type: "error",
      });
    }
    if (result.status === AddToCartStatus.AddedToInventory) {
      throw redirect(
        "events/inventory",
        {
          message: m.tickets_addToCart_addedToInventory(),
          type: "success",
        },
        event,
      );
    }
    let successMessage: string;
    switch (result.status) {
      case AddToCartStatus.AddedToCart:
        successMessage = m.tickets_addToCart_addedToCart();
        break;
      case AddToCartStatus.Reserved:
        successMessage = m.tickets_addToCart_lotteryReservation();
        break;
      case AddToCartStatus.PutInQueue:
        successMessage = m.tickets_addToCart_inQueue({
          queuePosition: result.queuePosition,
        });
        break;
      default:
        return message(form, {
          message: m.tickets_addToCart_unknownResult(),
          type: "error",
        });
    }
    throw redirect(
      "shop/cart",
      {
        message: successMessage,
        type: "success",
      },
      event,
    );
  },
};
