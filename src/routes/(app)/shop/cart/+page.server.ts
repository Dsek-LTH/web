import { ensureState } from "$lib/server/shop/addToCart/reservations";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { getCart } from "$lib/server/shop/getTickets";
import purchaseCart, {
  calculateCartPrice,
  priceWithTransactionFee,
  transactionFee,
} from "$lib/server/shop/payments/purchase";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { user, prisma } = locals;
  if (!user?.memberId && !user?.externalCode) {
    throw error(401, "Du har ingen kundvagn.");
  }
  depends("cart");
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
  const totalPrice = priceWithTransactionFee(calculateCartPrice(inCart));
  return {
    inCart,
    reservations,
    purchaseForm: await superValidate(purchaseForm),
    totalPrice: totalPrice,
    transactionFee: transactionFee(totalPrice),
  };
};

const purchaseForm = z.object({
  idempotencyKey: z.string(),
});
export type PurchaseForm = typeof purchaseForm;

export const actions = {
  removeItem: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, z.object({ id: z.string() }));
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return message(form, {
        message: "Du har ingen kundvagn.",
        type: "error",
      });
    }
    const consumable = await prisma.consumable.findUnique({
      where: {
        id: form.data.id,
      },
    });
    if (!consumable) {
      return message(form, {
        message: "Varan finns inte i din kundvagn.",
        type: "error",
      });
    }
    await prisma.consumable.delete({
      where: {
        id: consumable.id,
      },
    });
    await ensureState(
      authorizedPrismaClient,
      new Date(),
      consumable.shoppableId,
    );
    return message(form, {
      message: "Varan har tagits bort.",
      type: "success",
    });
  },
  removeReservation: async ({ locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, z.object({ id: z.string() }));
    if (!form.valid) return fail(400, { form });
    if (!user?.memberId && !user?.externalCode) {
      return message(form, {
        message: "Du har ingen kundvagn.",
        type: "error",
      });
    }
    const reservation = await prisma.consumableReservation.findUnique({
      where: {
        id: form.data.id,
      },
    });
    if (!reservation) {
      return message(form, {
        message: "Reservation finns inte i din kundvagn.",
        type: "error",
      });
    }
    await prisma.consumableReservation.delete({
      where: {
        id: reservation.id,
      },
    });
    await ensureState(
      authorizedPrismaClient,
      new Date(),
      reservation.shoppableId,
    );
    return message(form, {
      message: "Reservationen har tagits bort.",
      type: "success",
    });
  },
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
