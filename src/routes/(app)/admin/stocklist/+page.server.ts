import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;

  const items = await prisma.drinkItemBatch.findMany({
    include: { item: true },
  });

  const groupedMap = new Map<string, (typeof items)[number]>();

  for (const batch of items) {
    const existing = groupedMap.get(batch.item.id);
    if (existing) {
      existing.quantity += batch.quantity;
    } else {
      groupedMap.set(batch.item.id, { ...batch });
    }
  }

  const grouped = Array.from(groupedMap.values());

  // Also fetch all drink items from the catalog (like spritvikter page)
  const allDrinkItems = await prisma.drinkItem.findMany({
    orderBy: { name: "asc" },
  });

  const totalInventoryValue = items.reduce(
    (sum, i) => sum + i.item.price * i.quantity,
    0,
  );
  return { totalInventoryValue, grouped, allDrinkItems };
};
