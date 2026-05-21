import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "../$types";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";
import { DrinkGroup } from "@prisma/client";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

const zDrinkGroup = z.nativeEnum(DrinkGroup);

const deleteSchema = z.object({
  id: z.string(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number(),
  systembolagetID: z.number().int(),
  bottleEmptyWeight: z.number().int(),
  bottleFullWeight: z.number().int(),
  group: zDrinkGroup,
});

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;

  const drinkItems = (await prisma.drinkItem.findMany()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const deleteForm = await superValidate(zod(deleteSchema));
  const updateForm = await superValidate(zod(updateSchema));

  return { drinkItems, deleteForm, updateForm };
};

export const actions: Actions = {
  deleteEntry: async (event) => {
    const { prisma, user } = event.locals;
    authorize(apiNames.DRINKITEM.DELETE, user);
    const form = await superValidate(event.request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });

    try {
      await prisma.drinkItem.delete({
        where: { id: form.data.id },
      });
    } catch {
      return message(form, { message: `Produkt finns i lager` });
    }

    return message(form, { message: `Produkt borttagen` });
  },

  updateEntry: async (event) => {
    const { prisma, user } = event.locals;
    authorize(apiNames.DRINKITEM.UPDATE, user);
    const form = await superValidate(event.request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });

    await prisma.drinkItem.update({
      where: { id: form.data.id },
      data: {
        name: form.data.name,
        systembolagetID: form.data.systembolagetID,
        price: form.data.price * 100,
        group: form.data.group,
        bottleEmptyWeight: form.data.bottleEmptyWeight,
        bottleFullWeight: form.data.bottleFullWeight,
      },
    });
    return message(form, { message: `Produkt uppdaterad` });
  },
};
