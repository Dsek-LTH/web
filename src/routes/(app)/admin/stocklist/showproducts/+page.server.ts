import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "../$types";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";

const deleteSchema = z.object({
  id: z.string(),
});

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;

  const drinkItems = await prisma.drinkItem.findMany();
  const deleteForm = await superValidate(zod(deleteSchema));

  return { drinkItems, deleteForm };
};

export const actions: Actions = {
  deleteEntry: async (event) => {
    const { prisma } = event.locals;

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
};
