import { PUBLIC_STRIPE_KEY } from "$env/static/public";
import { moveQueueToCart } from "$lib/server/shop/addToCart/reservations.js";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma.js";
import { refundConsumable } from "$lib/server/shop/payments/stripeMethods.js";
import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import type { Event, Shoppable, Ticket } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export type ManagedTicket = Ticket &
  Shoppable & {
    event: Event;
  };

export const load = async ({ locals, params }) => {
  const { user, prisma } = locals;
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: params.slug,
    },
    include: {
      shoppable: {
        include: {
          consumables: {
            include: {
              member: true,
            },
          },
          reservations: {
            include: {
              member: true,
            },
          },
        },
      },
      event: true,
    },
  });
  if (!ticket) {
    error(404, "Ticket not found");
  }
  if (ticket.shoppable.authorId !== user.memberId) {
    // author can always manage
    authorize(apiNames.WEBSHOP.MANAGE, user);
  }
  const consumables = ticket.shoppable.consumables;
  const reservations = ticket.shoppable.reservations;
  const shoppable: Omit<Shoppable, "consumables" | "reservations"> & {
    consumables?: unknown;
    reservations?: unknown;
  } = ticket.shoppable;
  delete shoppable.consumables;
  delete shoppable.reservations;
  const mergedTicket: ManagedTicket & {
    shoppable?: unknown;
  } = {
    ...ticket.shoppable,
    ...ticket,
  };
  delete mergedTicket.shoppable;

  const isStripeTestEnvironment = PUBLIC_STRIPE_KEY.startsWith("pk_test");
  const stripeIntentBaseUrl = isStripeTestEnvironment
    ? "https://dashboard.stripe.com/test/payments"
    : "https://dashboard.stripe.com/payments";
  return {
    ticket: mergedTicket as ManagedTicket,
    consumables,
    reservations,
    stripeIntentBaseUrl,
  };
};

export const actions = {
  consume: async ({ locals, request, params }) => {
    const { prisma } = locals;
    const form = await superValidate(
      request,
      z.object({ consumableId: z.string() }),
    );
    if (!form.valid) return fail(400, { form });
    try {
      await prisma.consumable.update({
        where: {
          id: form.data.consumableId,
          shoppableId: params.slug,
        },
        data: {
          consumedAt: new Date(),
        },
      });
    } catch (e) {
      if (e instanceof Error)
        return message(form, {
          message: e.message,
          type: "error",
        });
      return message(form, {
        message: "Kunde inte konsumera biljetten.",
        type: "error",
      });
    }
    return message(form, {
      message: "Biljetten har konsumerats.",
      type: "success",
    });
  },
  unconsume: async ({ locals, request, params }) => {
    const { prisma } = locals;
    const form = await superValidate(
      request,
      z.object({ consumableId: z.string() }),
    );
    if (!form.valid) return fail(400, { form });
    try {
      await prisma.consumable.update({
        where: {
          id: form.data.consumableId,
          shoppableId: params.slug,
        },
        data: {
          consumedAt: null,
        },
      });
    } catch (e) {
      if (e instanceof Error)
        return message(form, {
          message: e.message,
          type: "error",
        });
      return message(form, {
        message: "Kunde inte avkonsumera biljetten.",
        type: "error",
      });
    }
    return message(form, {
      message: "Biljetten har avkonsumerats.",
      type: "success",
    });
  },
  refund: async ({ locals, request, params }) => {
    const { prisma } = locals;
    const form = await superValidate(
      request,
      z.object({ consumableId: z.string() }),
    );
    if (!form.valid) return fail(400, { form });
    try {
      const consumable = await prisma.consumable.findUnique({
        where: {
          id: form.data.consumableId,
          shoppableId: params.slug,
        },
        include: {
          shoppable: true,
        },
      });
      if (!consumable) {
        return message(form, {
          message: "Biljetten hittades inte.",
          type: "error",
        });
      }
      if (consumable.stripeIntentId) {
        await refundConsumable(
          consumable.stripeIntentId,
          consumable.priceAtPurchase ?? consumable.shoppable.price, // to ensure correct refund amount if shoppable price has changed
        );
      }
      await authorizedPrismaClient.consumable.delete({
        where: {
          id: consumable.id,
        },
      });
      await moveQueueToCart(
        authorizedPrismaClient,
        consumable.shoppableId,
        1,
        true,
      );

      return message(form, {
        message: "Biljetten har återbetalats.",
        type: "success",
      });
    } catch (e) {
      if (e instanceof Error)
        return message(form, {
          message: e.message,
          type: "error",
        });
      return message(form, {
        message: "Kunde inte återbetala biljetten.",
        type: "error",
      });
    }
  },
};
