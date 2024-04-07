import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { addTicketToCart } from "$lib/server/shop/addToCart";
import { getTickets } from "$lib/server/shop/getTickets";

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
    if (!user?.memberId && !user?.externalCode) {
      return fail(401);
    }
    try {
      const res = await addTicketToCart(
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
