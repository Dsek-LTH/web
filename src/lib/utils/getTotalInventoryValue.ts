import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { DrinkQuantityType, Prisma } from "@prisma/client";

export async function getTotalInventoryValue(prisma: ExtendedPrisma) {
  const items = await prisma.drinkItemBatch.findMany({
    include: { item: true },
  });

  const groupedMap = new Map<string, (typeof items)[number]>();

  for (const batch of items) {
    const existing = groupedMap.get(batch.item.id);
    if (existing) {
      existing.quantityIn =
        (existing.quantityIn ?? 0) + (batch.quantityIn ?? 0);
      existing.quantityOut =
        (existing.quantityOut ?? 0) + (batch.quantityOut ?? 0);

      if (batch.item.quantityType === DrinkQuantityType.WEIGHT) {
        const isBatchIn = batch.quantityIn != null;
        if (isBatchIn) {
          existing.nrBottles = existing.nrBottles! + batch.nrBottles!;
        } else {
          existing.nrBottles = existing.nrBottles! - batch.nrBottles!;
        }
      }
    } else {
      groupedMap.set(batch.item.id, { ...batch });
    }
  }

  const grouped = Array.from(groupedMap.values());

  const totalInventoryValue = grouped.reduce((sum, i) => {
    if (i.item.quantityType === DrinkQuantityType.WEIGHT) {
      const realWeight =
        (i.quantityIn ?? 0) -
        (i.quantityOut ?? 0) -
        i.item.bottleEmptyWeight! * i.nrBottles!;
      const fullRealWeight =
        i.item.bottleFullWeight! - i.item.bottleEmptyWeight!;
      const pricePerWeight = i.item.price / fullRealWeight;
      const price = pricePerWeight * realWeight;
      return Math.floor(sum + price);
    }

    return sum + i.item.price * ((i.quantityIn ?? 0) - (i.quantityOut ?? 0));
  }, 0);

  return { totalInventoryValue, grouped };
}
