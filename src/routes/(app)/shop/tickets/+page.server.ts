import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { addTicketToCart } from "$lib/server/shop/addToCart/addToCart";
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
    let successMessage: string;
    try {
      successMessage = await addTicketToCart(
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
