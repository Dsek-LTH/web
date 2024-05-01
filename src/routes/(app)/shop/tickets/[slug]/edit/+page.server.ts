import { ticketSchema } from "$lib/components/shop/types.js";
import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import { ShoppableType } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";

export const load = async ({ locals, params }) => {
  const { user } = locals;
  const ticket = await locals.prisma.ticket.findUnique({
    where: {
      id: params.slug,
    },
    include: {
      shoppable: true,
      event: true,
    },
  });
  if (!ticket) {
    error(404, { message: "Biljetten kunde inte hittas" });
  }
  if (ticket.shoppable.authorId !== user.memberId) {
    // author can always edit
    authorize(apiNames.WEBSHOP.MANAGE, user);
  }

  return {
    form: await superValidate(
      {
        title: ticket.shoppable.title,
        titleEn: ticket.shoppable.titleEn,
        description: ticket.shoppable.descriptionEn,
        descriptionEn: ticket.shoppable.descriptionEn,
        price: ticket.shoppable.price / 100,
        availableFrom: ticket.shoppable.availableFrom,
        availableTo: ticket.shoppable.availableTo,
        eventId: ticket.eventId,
        stock: ticket.stock,
        maxAmountPerUser: ticket.maxAmountPerUser,
      },
      ticketSchema,
      { errors: false },
    ),
    event: ticket.event,
  };
};

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const { prisma, user, member } = locals;
    const form = await superValidate(request, ticketSchema);
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.CREATE, user);
    if (!member) {
      // this should be handled by the authorization call above
      return message(form, {
        message: "Du måste vara inloggad för att skapa biljetter",
        type: "error,",
      });
    }
    const data = form.data;
    const ticketId = event.params.slug;
    try {
      await prisma.ticket.update({
        where: {
          id: ticketId,
        },
        data: {
          shoppable: {
            update: {
              title: data.title,
              titleEn: data.titleEn,
              description: data.description,
              descriptionEn: data.descriptionEn,
              price: Math.round(data.price * 100),
              availableFrom: data.availableFrom,
              availableTo: data.availableTo,
              type: ShoppableType.TICKET,
            },
          },
          event: {
            connect: {
              id: data.eventId,
            },
          },
          stock: data.stock,
          maxAmountPerUser: data.maxAmountPerUser, // optional
        },
      });
    } catch (err) {
      let errorMsg;
      if (err instanceof Error) errorMsg = err.message;
      else errorMsg = String(err);
      console.log("Error creating ticket", errorMsg);
      return message(form, {
        message: "Kunde inte skapa biljett: " + errorMsg,
        type: "error,",
      });
    }
    throw redirect(
      `/shop/tickets/${ticketId}`,
      {
        message: "Biljett uppdaterad",
        type: "success",
      },
      event,
    );
  },
};
