import {
  addTicketToCart,
  AddToCartStatus,
  type AddToCartResult,
} from "$lib/server/shop/addToCart/addToCart";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import type { Actions } from "@sveltejs/kit";
import { fail, message, superValidate, type Infer } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";

const addToCartSchema = z.object({
  ticketId: z.string().uuid(),
});
export type AddToCartSchema = Infer<typeof addToCartSchema>;

export const ticketPageActions = (prefix = "/shop/"): Actions => ({
  addToCart: async (event) => {
    const { locals, request } = event;
    const { prisma, user } = locals;
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    const form = await superValidate(request, zod4(addToCartSchema));
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return fail(401, { form });
    }
    let result: AddToCartResult;
    try {
      result = await addTicketToCart(prisma, form.data.ticketId, user);
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
        `${prefix}inventory`,
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
      `${prefix}cart`,
      {
        message: successMessage,
        type: "success",
      },
      event,
    );
  },
});
