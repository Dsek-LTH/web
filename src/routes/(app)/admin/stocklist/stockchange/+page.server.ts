import type { Actions } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import dayjs from "dayjs";
import * as messages from "$paraglide/messages";

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const inForm = await superValidate(zod4(createInBatchSchema));
  const outForm = await superValidate(zod4(createOutBatchSchema));
  const drinkItems = (await prisma.drinkItem.findMany()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return { inForm, outForm, drinkItems };
};

const createOutBatchSchema = z.object({
  drinkItemId: z.string(),
  quantityDelta: z.number().nonnegative(),
  date: z
    .string()
    .date()
    .default(() => new Date().toLocaleDateString("se-SE")),
  nrBottles: z.number().nonnegative().default(0),
});

const createInBatchSchema = z.object({
  drinkItemId: z.string(),
  quantityDelta: z.number().nonnegative(),
  date: z
    .string()
    .date()
    .default(() => new Date().toLocaleDateString("se-SE")),
  nrBottles: z.number().nonnegative().default(0),
});

export const actions: Actions = {
  createInBatch: async (event) => {
    const { prisma, user } = event.locals;
    authorize(apiNames.DRINKITEMBATCH.CREATE, user);
    const form = await superValidate(event.request, zod4(createInBatchSchema));
    if (!form.valid) return fail(400, { form });

    if (form.data.quantityDelta === 0) {
      return message(form, {
        message: messages.admin_stocklist_may_not_be_zero(),
      });
    }

    await prisma.drinkItemBatch.create({
      data: {
        drinkItemId: form.data.drinkItemId,
        quantityDelta: form.data.quantityDelta,
        nrBottlesDelta: form.data.nrBottles,
        date: dayjs(form.data.date).toDate(),
        user: user.studentId!,
      },
    });

    await prisma.drinkItem.update({
      where: { id: form.data.drinkItemId },
      data: {
        quantityAvailable: {
          increment: form.data.quantityDelta,
        },
        nrBottles: {
          increment: form.data.nrBottles,
        },
      },
    });
    return message(form, { message: messages.admin_stocklist_booked_in() });
  },

  createOutBatch: async (event) => {
    const { prisma, user } = event.locals;
    authorize(apiNames.DRINKITEMBATCH.CREATE, user);
    const form = await superValidate(event.request, zod4(createOutBatchSchema));
    if (!form.valid) return fail(400, { form });

    if (form.data.quantityDelta === 0) {
      return message(form, {
        message: messages.admin_stocklist_may_not_be_zero(),
      });
    }

    const result = await prisma.drinkItem.updateMany({
      where: {
        id: form.data.drinkItemId,
        quantityAvailable: { gte: form.data.quantityDelta },
      },
      data: {
        quantityAvailable: {
          decrement: form.data.quantityDelta,
        },
        nrBottles: {
          decrement: form.data.nrBottles,
        },
      },
    });

    if (result.count === 0) {
      return message(form, {
        message: messages.admin_stocklist_not_enough_in_stock(),
      });
    }

    await prisma.drinkItemBatch.create({
      data: {
        drinkItemId: form.data.drinkItemId,
        quantityDelta: -form.data.quantityDelta,
        nrBottlesDelta: -form.data.nrBottles,
        date: dayjs(form.data.date).toDate(),
        user: user.studentId!,
      },
    });

    return message(form, { message: messages.admin_stocklist_booked_out() });
  },
};
