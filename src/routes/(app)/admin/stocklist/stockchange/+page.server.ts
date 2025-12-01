import type { Actions } from "@sveltejs/kit";
import { superValidate, fail, message } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const form = await superValidate(event.request, zod(DrinkItemBatchSchema));
  const drinks = await prisma.drinkItem.findMany();

  const entriesIn = await prisma.drinkItemBatch.findMany({
    where: {
      quantityIn: { gt: 0 },
    },
  });
  const entriesOut = await prisma.drinkItemBatch.findMany({
    where: {
      quantityOut: { gt: 0 },
    },
  });

  return { form, drinks, entriesIn, entriesOut };
};

const DrinkItemBatchSchema = z.object({
  drinkItemId: z.string(),
  quantityOut: z.number().nonnegative(),
  inOut: z.string(),
  quantityIn: z.number().nonnegative(),
  date: z.coerce.date().default(() => new Date()),
});

export const actions: Actions = {
  createDrinkItemBatch: async (event) => {
    const { user, prisma } = event.locals;

    authorize(apiNames.DRINKITEMBATCH.CREATE, user);
    const form = await superValidate(event.request, zod(DrinkItemBatchSchema));
    if (!form.valid) return fail(400, { form });

    if (form.data.inOut == "IN") {
      if (form.data.quantityIn === 0) {
        return message(form, { message: "Får inte vara 0" });
      }
      await prisma.drinkItemBatch.create({
        data: {
          drinkItemId: form.data.drinkItemId,
          quantityIn: form.data.quantityIn,
          date: form.data.date,
          user: user.studentId!,
        },
      });

      return message(form, { message: "Antal inskrivet" });
    }
    if (form.data.inOut == "OUT") {
      if (form.data.quantityOut === 0) {
        return message(form, { message: "Får inte vara 0" });
      }
      const requestedId = form.data.drinkItemId;
      const requestedAmount = form.data.quantityOut;

      const entriesIn = await prisma.drinkItemBatch.findMany({
        where: {
          drinkItemId: requestedId,
          quantityIn: { gt: 0 },
        },
      });
      const entriesOut = await prisma.drinkItemBatch.findMany({
        where: {
          drinkItemId: requestedId,
          quantityOut: { gt: 0 },
        },
      });
      const amountIn = entriesIn.reduce((sum, i) => sum + i.quantityIn!, 0);
      const amountOut = entriesOut.reduce((sum, i) => sum + i.quantityOut!, 0);

      const availableAmount = amountIn - amountOut;

      if (requestedAmount! > availableAmount) {
        return message(form, {
          message: `Finns inte ${requestedAmount} i lager`,
        });
      }

      await prisma.drinkItemBatch.create({
        data: {
          drinkItemId: form.data.drinkItemId,
          quantityOut: form.data.quantityOut,
          date: form.data.date,
          user: user.studentId!,
        },
      });

      return message(form, { message: "Antal utskrivet" });
    }
  },
};
