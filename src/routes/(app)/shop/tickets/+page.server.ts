import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import {
  AddToCartStatus,
  addTicketToCart,
  type AddToCartResult,
} from "$lib/server/shop/addToCart/addToCart";
import { getTickets } from "$lib/server/shop/getTickets";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async ({ locals }) => {
  const allTickets = await getTickets(locals.prisma);
  return {
    tickets: allTickets,
    addToCartForm: await superValidate(addToCartSchema),
  };
};

const addToCartSchema = z.object({
  ticketId: z.string().uuid(),
});
export type AddToCartSchema = typeof addToCartSchema;

export const actions = {
  addToCart: async (event) => {
    const { locals, request } = event;
    const { prisma, user } = locals;
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    const form = await superValidate(request, addToCartSchema);
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
          message: "Biljetten har köpts.",
          type: "success",
        },
        event,
      );
    }
    let successMessage: string;
    switch (result.status) {
      case AddToCartStatus.AddedToCart:
        successMessage = "Biljetten har lagts till i varukorgen.";
        break;
      case AddToCartStatus.Reserved:
        successMessage =
          "Biljetten har reserverats. Du får en notis när lottningen är klar.";
        break;
      case AddToCartStatus.PutInQueue:
        successMessage = `Du är i kö för biljetten, din plats i kön är ${result.queuePosition}.`;
        break;
      default:
        return message(form, {
          message: "Okänd resultatstatus från addToCart.",
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
