import { DrinkQuantityType, DrinkGroup } from "@prisma/client";
import type { Actions } from "@sveltejs/kit";
import { superValidate, fail, message } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;

  const spirits = await prisma.drinkItem.findMany({
    where: { quantityType: DrinkQuantityType.WEIGHT },
    orderBy: { name: "asc" },
  });

  const form = await superValidate(zod(AddSpiritSchema));
  return { spirits, form };
};

const AddSpiritSchema = z.object({
  name: z.string().min(1),
  systembolagetID: z.coerce.number().int(),
  price: z.coerce.number(),
  group: z.nativeEnum(DrinkGroup),
  weight: z.coerce.number().int().optional(),
  emptyWeight: z.coerce.number().int().optional(),
});

export const actions: Actions = {
  addSpirit: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.DRINKITEM.CREATE, user);

    const form = await superValidate(event.request, zod(AddSpiritSchema));
    if (!form.valid) return fail(400, { form });

    await prisma.drinkItem.create({
      data: {
        quantityType: DrinkQuantityType.WEIGHT,
        name: form.data.name,
        systembolagetID: form.data.systembolagetID,
        price: Math.round(form.data.price * 100),
        group: form.data.group,
        weight: form.data.weight,
        emptyWeight: form.data.emptyWeight,
      },
    });

    return message(form, { message: "Sprit tillagd" });
  },
};
