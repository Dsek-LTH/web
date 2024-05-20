import { ticketSchema } from "$lib/components/shop/types.js";
import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import { ShoppableType } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import dayjs from "dayjs";
import { redirect } from "$lib/utils/redirect";
import { message, superValidate } from "sveltekit-superforms/server";

export const load = async ({ locals }) => {
  const { user } = locals;
  authorize(apiNames.WEBSHOP.CREATE, user);

  return {
    form: await superValidate(
      {
        availableFrom: dayjs(new Date())
          .add(1, "day")
          .hour(12)
          .minute(15)
          .second(0)
          .toDate(),
        maxAmountPerUser: 1,
        stock: 0,
        price: 0,
      },
      ticketSchema,
      { errors: false },
    ),
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
    let ticketId: string;
    try {
      const ticket = await prisma.ticket.create({
        data: {
          shoppable: {
            create: {
              title: data.title,
              titleEn: data.titleEn,
              description: data.description,
              descriptionEn: data.descriptionEn,
              price: Math.round(data.price * 100),
              availableFrom: data.availableFrom,
              availableTo: data.availableTo,
              type: ShoppableType.TICKET,
              authorId: member.id,
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
      ticketId = ticket.id;
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
        message: "Biljett skapad",
        type: "success",
      },
      event,
    );
  },
};
