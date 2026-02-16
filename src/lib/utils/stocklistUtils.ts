import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { DrinkGroup, DrinkQuantityType } from "@prisma/client";

type StockRow = {
  quantityType: DrinkQuantityType;
  name: string;
  price: number;
  group: DrinkGroup;
  systembolagetId: number;
  bottleEmptyWeight: number | null;
  bottleFullWeight: number | null;
};

export async function inventoryValue(prisma: ExtendedPrisma) {
  const items = await prisma.drinkItem.findMany({
    where: {
      quantityAvailable: { gt: 0 },
    },
  });

  let value = 0;

  for (const item of items) {
    if (item.quantityType === "COUNTS") {
      value += (item.price / 100) * item.quantityAvailable!;
    } else {
      const bottleWeight = item.bottleEmptyWeight!;
      const liquidWeight = item.quantityAvailable! - bottleWeight;
      const bottlePrice = item.price / 100;
      const fullBottleLiquidWeight = item.bottleFullWeight! - bottleWeight;
      value += (liquidWeight / fullBottleLiquidWeight) * bottlePrice;
    }
  }
  return value;
}

export async function readCSV(prisma: ExtendedPrisma, file: File) {
  const text = await file.text();

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

  const cell = (arr: string[], i: number) => (arr[i] ?? "").trim();

  const toNumberOrNull = (v: string): number | null =>
    v === "" ? null : Number(v);

  const rows: StockRow[] = lines.slice(1).map((line) => {
    const values = line.split(",");

    return {
      quantityType: cell(values, 0) as DrinkQuantityType,
      name: cell(values, 1),
      price: Number(cell(values, 2)),
      group: cell(values, 3) as DrinkGroup,
      systembolagetId: Number(cell(values, 4)),
      bottleEmptyWeight: toNumberOrNull(cell(values, 5)),
      bottleFullWeight: toNumberOrNull(cell(values, 6)),
    };
  });

  return rows;
}
