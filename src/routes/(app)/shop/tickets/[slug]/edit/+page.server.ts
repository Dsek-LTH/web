import { QuestionType, ticketSchema } from "$lib/utils/shop/types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { updateTicket } from "$lib/server/shop/tickets/mutations";

export const load = async ({ locals, params }) => {
  const { user } = locals;
  const ticket = await locals.prisma.ticket.findUnique({
    where: {
      id: params.slug,
    },
    include: {
      shoppable: {
        include: {
          questions: {
            where: { removedAt: null },
            include: {
              options: true,
            },
          },
        },
      },
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

  console.log(ticket.shoppable.questions);

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
        questions: ticket.shoppable.questions.map((q) => ({
          ...q,
          type: q.type as QuestionType,
        })),
      },
      zod(ticketSchema),
      { errors: false },
    ),
    event: ticket.event,
  };
};

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const { prisma, user, member } = locals;
    const form = await superValidate(request, zod(ticketSchema));
    if (!form.valid) return fail(400, { form });
    authorize(apiNames.WEBSHOP.CREATE, user);
    if (!member) {
      // this should be handled by the authorization call above
      return message(form, {
        message: "Du måste vara inloggad för att skapa biljetter",
        type: "error,",
      });
    }
    const ticketId = event.params.slug;

    try {
      await updateTicket(prisma, ticketId, form.data);
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
