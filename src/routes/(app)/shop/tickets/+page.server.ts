import {
  AddToCartStatus,
  addTicketToCart,
  type AddToCartResult,
} from "$lib/server/shop/addToCart/addToCart";
import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getTickets } from "$lib/server/shop/getTickets";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { user, prisma } = locals;

  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) error(401);
  depends("tickets");
  const identification = memberId
    ? {
        memberId: memberId,
      }
    : {
        externalCode: externalCode!,
      };
  const allTickets = await getTickets(prisma, identification);
  if (locals.isApp && memberId) {
    const shopItemCounts = await countUserShopItems(prisma, user);
    return {
      shopItemCounts,
      tickets: allTickets,
    };
  }

  return {
    tickets: allTickets,
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
        "/shop/inventory",
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
      "/shop/cart",
      {
        message: successMessage,
        type: "success",
      },
      event,
    );
  },
};
