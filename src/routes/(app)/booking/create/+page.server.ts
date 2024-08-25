import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import { bookingSchema } from "../schema";
import dayjs from "dayjs";

export const load = async ({ locals }) => {
  const { prisma } = locals;
  const bookables = await prisma.bookable.findMany();
  const bookingRequests = await prisma.bookingRequest.findMany({
    where: {
      end: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
      booker: true,
    },
  });
  const form = await superValidate(zod(bookingSchema));

  return { bookables, bookingRequests, form };
};

export const actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;

    const form = await superValidate(request, zod(bookingSchema));
    if (!form.valid) return fail(400, { form });
    const { start, end, name, bookables } = form.data;

    await prisma.bookingRequest.create({
      data: {
        bookerId: user?.memberId,
        start: new Date(start),
        end: new Date(end),
        event: name,
        bookables: {
          connect: bookables.map((bookable) => ({
            id: bookable,
          })),
        },
        status: "PENDING",
      },
    });

    throw redirect(
      `/booking`,
      {
        message: m.booking_requestSent(),
        type: "success",
      },
      event,
    );
  },
};
