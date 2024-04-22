import apiNames from "$lib/utils/apiNames.js";
import { authorize } from "$lib/utils/authorization.js";
import { ShoppableType } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import dayjs from "dayjs";
import { redirect } from "sveltekit-flash-message/server";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

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
      createTicketSchema,
      { errors: false },
    ),
  };
};

const createTicketSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty"),
    titleEn: z.string().nullable().optional(),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .nullable()
      .optional(),
    descriptionEn: z.string().nullable().optional(),
    // price is in SEK, with a maximum of two decimals
    price: z
      .number()
      .gte(0)
      .transform((v) => {
        return Math.round(v * 100);
      }),
    availableFrom: z.date(),
    availableTo: z.date().nullable().optional(), // cannot be before availableFRom
    eventId: z.string().uuid(),
    stock: z.number().int("Stock must be an integer").gte(0),
    maxAmountPerUser: z
      .number()
      .int("Max amount per user must be an integer")
      .positive()
      .optional(),
  })
  .refine(
    (data) =>
      !data.availableTo ||
      dayjs(data.availableFrom).isBefore(dayjs(data.availableTo)),
    {
      message: "Available from must be before available to",
      path: ["availableTo"],
    },
  );

export type CreateTicketSchema = typeof createTicketSchema;

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const { prisma, user, member } = locals;
    const form = await superValidate(request, createTicketSchema);
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
    try {
      await prisma.ticket.create({
        data: {
          shoppable: {
            create: {
              title: data.title,
              titleEn: data.titleEn,
              description: data.description,
              descriptionEn: data.descriptionEn,
              price: data.price,
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
      "/shop/tickets",
      {
        message: "Biljett skapad",
        type: "success",
      },
      event,
    );
  },
};
