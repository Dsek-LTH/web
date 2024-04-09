import { getCart } from "$lib/server/shop/getTickets";
import purchaseCart from "$lib/server/shop/purchase";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { user, prisma } = locals;
  if (!user?.memberId && !user?.externalCode) {
    throw error(401, "Du har ingen kundvagn.");
  }
  const { inCart, reservations } = await getCart(
    prisma,
    user?.memberId
      ? {
          memberId: user.memberId,
        }
      : {
          externalCode: user.externalCode!,
        },
  );
  return {
    inCart,
    reservations,
    purchaseForm: await superValidate(purchaseForm),
  };
};

const purchaseForm = z.object({
  idempotencyKey: z.string(),
});
export type PurchaseForm = typeof purchaseForm;

export const actions = {
  purchase: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, purchaseForm);
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      throw error(401, "Du har ingen kundvagn.");
    }
    try {
      const data = await purchaseCart(
        prisma,
        user.memberId
          ? {
              memberId: user.memberId,
            }
          : {
              externalCode: user.externalCode!,
            },
        form.data.idempotencyKey,
      );
      return message(form, data);
    } catch (err) {
      return message(
        form,
        {
          message: `${
            "message" in (err as Error) ? (err as Error).message : err
          }`,
          type: "error",
        },
        {
          status: 500,
        },
      );
    }
  },
};
