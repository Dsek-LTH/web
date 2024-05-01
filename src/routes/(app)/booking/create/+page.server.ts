import { fail } from "@sveltejs/kit";
import dayjs from "dayjs";
import { superValidate } from "sveltekit-superforms/server";
import { redirect } from "$lib/utils/redirect";
import { z } from "zod";

const schema = z
  .object({
    name: z.string().min(1),
    start: z.string().default(() => dayjs().format("YYYY-MM-DDTHH:MM")),
    end: z.string().default(() => dayjs().format("YYYY-MM-DDTHH:MM")),
    bookables: z.array(z.string()).min(1),
  })
  .refine((data) => dayjs(data.start).isBefore(dayjs(data.end)), {
    message: "Start date must be before end date",
    path: ["end"],
  });

export const load = async ({ locals }) => {
  const { prisma } = locals;
  const bookables = await prisma.bookable.findMany();
  const form = await superValidate(schema);

  return { bookables, form };
};

export const actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;

    const form = await superValidate(request, schema);
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
        message: "Bokningsförfrågan skickad!",
        type: "success",
      },
      event,
    );
  },
};
