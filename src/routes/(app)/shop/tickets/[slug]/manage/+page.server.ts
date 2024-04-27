import { PUBLIC_STRIPE_KEY } from "$env/static/public";
import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import type { Event, Shoppable, Ticket } from "@prisma/client";
import { error } from "@sveltejs/kit";

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

// export const actions = {};
