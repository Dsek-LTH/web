import { inventoryValue, readCSV } from "$lib/utils/stocklistUtils";
import { fail } from "sveltekit-superforms";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const drinkItems = await prisma.drinkItem.findMany({
    where: {
      quantityAvailable: { gt: 0 },
    },
  });
  const currentInventoryValue = await inventoryValue(prisma);

  return { currentInventoryValue, drinkItems };
};

export const actions: Actions = {
  readFile: async ({ request, locals }) => {
    const prisma = locals.prisma;
    const form = await request.formData();
    const file = form.get("upload");

    if (!(file instanceof File)) {
      return fail(400, { message: "No file uploaded" });
    }

    const items = await readCSV(prisma, file);

    for (var item of items) {
      await prisma.drinkItem.create({
        data: {
          name: item.name,
          price: item.price * 100,
          group: item.group,
          systembolagetID: item.systembolagetId,
          quantityType: item.quantityType,
          bottleEmptyWeight: item.bottleEmptyWeight,
          bottleFullWeight: item.bottleFullWeight,
        },
      });
    }
    return {
      success: true,
      message: `Produkter skapade`,
    };
  },
};
