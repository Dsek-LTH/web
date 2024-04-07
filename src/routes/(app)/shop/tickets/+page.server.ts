import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { addTicketToCart, getTickets } from "./tickets";

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

    const form = await superValidate(request, addToCartSchema);
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.PURCHASE, user);
    try {
      const res = await addTicketToCart(prisma, form.data.ticketId, {
        memberId: user!.memberId,
        externalCode: undefined,
      });

      throw redirect(
        "/cart",
        {
          message: res,
          type: "success",
        },
        event,
      );
    } catch (err) {
      return message(form, {
        message: err,
        type: "error",
      });
    }
  },
};
