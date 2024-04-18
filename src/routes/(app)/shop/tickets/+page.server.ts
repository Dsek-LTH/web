import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const allTickets = await locals.prisma.ticket.findMany({
    where: {
      shoppable: {
        AND: [
          {
            OR: [
              {
                removedAt: null,
              },
              {
                removedAt: {
                  lt: new Date(),
                },
              },
            ],
          },
          {
            OR: [
              {
                availableTo: null,
              },
              {
                availableTo: {
                  gt: tenDaysAgo, // show items which were available in the last 10 days
                },
              },
            ],
          },
        ],
      },
    },
    include: {
      shoppable: true,
      event: {
        include: {
          tags: true,
        },
      },
    },
    orderBy: {
      shoppable: {
        availableFrom: "asc",
      },
    },
  });
  return {
    tickets: allTickets,
    addToCartForm: await superValidate(addToCartSchema),
  };
};

const addToCartSchema = z.object({
  ticketId: z.string(),
});
export type AddToCartSchema = typeof addToCartSchema;

export const actions = {
  addToCart: async (event) => {
    const { locals, request } = event;
    const { user } = locals;
    const form = await superValidate(request, addToCartSchema);
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.PURCHASE, user);

    // addToCart logic here

    /**
     * possible outcomes:
     * - success: ticket added to cart
     * - internal error: ticket could not be added to cart
     * - 400 (see below)
     */

    /***
     * Criteria:
     * - Exists
     * - Is available (not upcoming, not expired)
     * - Stock left (not sold out)
     * Then:
     * If < 1 min since launch (reserve ticket):
     * - Item is already not reserved by user
     * Else:
     * - User does not already have max amount in cart
     */

    /***
     * Criteria:
     * - Exists -> Doesn't exist (400)
     * - Is available (not upcoming, not expired) -> Not available (400)
     * - Stock left (not sold out) -> Sold out (400)
     * Then:
     * If < 1 min since launch (reserve ticket):
     * - Item is already not reserved by user -> Already reserved (400)
     * Else:
     * - User does not already have max amount in cart -> Already max in cart (400)
     */
    // const result = Math.floor(Math.random() * 8);
    // switch (result) {
    //   case 0:
    //     // success
    //     throw redirect(
    //       "/cart",
    //       {
    //         message: "Biljett tillagd i varukorgen!",
    //         type: "success",
    //       },
    //       event,
    //     );
    //   case 1:
    //     // internal error
    //     return message(form, {
    //       message: "Något gick fel, försök igen senare",
    //       type: "error",
    //     });
    //   case 2:
    //     // 400
    //     return message(form, {
    //       message: "Kunde inte hitta biljett",
    //       type: "error",
    //     });
    //   case 3:
    //     // 400
    //     return message(form, {
    //       message: "Biljett är inte tillgänlig än",
    //       type: "error",
    //     });
    //   case 4:
    //     // 400
    //     return message(form, {
    //       message: "Biljettförsäljning har stängt",
    //       type: "error",
    //     });
    //   case 5:
    //     // 400
    //     return message(form, {
    //       message: "Biljetten är slutsåld",
    //       type: "error",
    //     });
    //   case 6:
    //     // already reserved
    //     return message(form, {
    //       message:
    //         "Biljetten är redan reserverad, du får en notis när lottning är avklarad.",
    //       type: "error",
    //     });
    //   case 7:
    //     return message(form, {
    //       // message: "Du har redan max antal biljetter i varukorgen", // if max > 1
    //       message: "Du har redan den här biljetten i varukorgen",
    //       type: "error",
    //     });
    // }

    return redirect(
      "/cart",
      {
        message: "Biljett tillagd i varukorgen!",
        type: "success",
      },
      event,
    );
  },
};
