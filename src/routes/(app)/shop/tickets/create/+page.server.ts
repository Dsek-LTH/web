import apiNames from "$lib/utils/apiNames";
import { authorise } from "$lib/utils/authorization";
import { redirect } from "sveltekit-flash-message/server";
import { fail } from "@sveltejs/kit";
import dayjs from "dayjs";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { createTicket } from "$lib/server/shop/tickets/mutations";
import { ticketSchema } from "$lib/utils/shop/types";
import * as messages from "$paraglide/messages";

export const load = async ({ locals }) => {
  const { user } = locals;
  authorise(apiNames.WEBSHOP.CREATE, user);

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
      zod4(ticketSchema),
      { errors: false },
    ),
  };
};

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const { prisma, user, member } = locals;
    const form = await superValidate(request, zod4(ticketSchema));
    if (!form.valid) return fail(400, { form });
    authorise(apiNames.WEBSHOP.CREATE, user);
    if (!member) {
      // this should be handled by the authorization call above
      return message(form, {
        message: messages.tickets_create_not_logged_in(),
        type: "error",
      });
    }
    let ticketId: string;
    try {
      const ticket = await createTicket(prisma, member.id, form.data);
      ticketId = ticket.id;
    } catch (err) {
      let errorMsg;
      if (err instanceof Error) errorMsg = err.message;
      else errorMsg = String(err);
      console.log("Error creating ticket", errorMsg);
      return message(form, {
        message: messages.tickets_create_generic_error() + ": " + errorMsg,
        type: "error",
      });
    }
    throw redirect(
      `/shop/tickets/${ticketId}`,
      {
        message: messages.tickets_created(),
        type: "success",
      },
      event,
    );
  },
};
