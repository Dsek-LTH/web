import { query, command, form, getRequestEvent } from "$app/server";
import { z } from "zod";
import { DrinkGroup, DrinkQuantityType } from "@prisma/client";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { inventoryValue, readCSV } from "$lib/utils/stocklistUtils";
import dayjs from "dayjs";

const zDrinkGroup = z.nativeEnum(DrinkGroup);
const zDrinkQuantityType = z.nativeEnum(DrinkQuantityType);

const DrinkItemSchema = z.object({
  name: z.string().min(1),
  systembolagetID: z.number().int().positive(),
  group: zDrinkGroup,
  price: z.number().positive(),
  quantityType: zDrinkQuantityType,
  bottleEmptyWeight: z.number().int().nonnegative().optional(),
  bottleFullWeight: z.number().int().nonnegative().optional(),
});

type DrinkItemInput = z.infer<typeof DrinkItemSchema>;

const EditDrinkItemSchema = DrinkItemSchema.extend({
  id: z.string().uuid(),
});

type EditDrinkItemInput = z.infer<typeof EditDrinkItemSchema>;

const StockchangeSchema = z.object({
  drinkItemId: z.string().uuid(),
  type: z.enum(["IN", "OUT"]),
  quantityDelta: z.number().positive(),
  nrBottlesDelta: z.number().nonnegative().optional().default(0),
  date: z.string().date(),
});

type StockchangeInput = z.infer<typeof StockchangeSchema>;

const UpdateLogSchema = z.object({
  id: z.string().uuid(),
  quantityDelta: z.number(),
  nrBottlesDelta: z.number().optional(),
});

type UpdateLogInput = z.infer<typeof UpdateLogSchema>;

const CSVSchema = z.object({
  file: z.instanceof(File),
});

type CSVInput = z.infer<typeof CSVSchema>;

// Queries
export const getStockOverview = query(async () => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEM.READ, locals.user);

  const drinkItems = await locals.prisma.drinkItem.findMany({
    where: { quantityAvailable: { gt: 0 } },
    orderBy: { name: "asc" },
  });
  const currentInventoryValue = await inventoryValue(locals.prisma);

  return { drinkItems, currentInventoryValue };
});

export const getProducts = query(async () => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEM.READ, locals.user);

  const drinkItems = await locals.prisma.drinkItem.findMany({
    orderBy: { name: "asc" },
  });
  return drinkItems;
});

export const getLogs = query(z.string().nullable().optional(), async (date) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEMBATCH.READ, locals.user);

  let whereClause = {};
  if (date) {
    const startOfDay = dayjs(date).startOf("day").toDate();
    const endOfDay = dayjs(date).endOf("day").toDate();
    whereClause = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };
  }

  const logs = await locals.prisma.drinkItemBatch.findMany({
    where: whereClause,
    include: { item: true },
    orderBy: { date: "desc" },
  });

  return logs;
});

// Commands / Forms
export const createDrinkItem = form(DrinkItemSchema, async (raw_data) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEM.CREATE, locals.user);

  const data = raw_data as unknown as DrinkItemInput;

  await locals.prisma.drinkItem.create({
    data: {
      name: data.name,
      systembolagetID: data.systembolagetID,
      group: data.group,
      price: Math.round(data.price * 100), // convert to cents
      quantityType: data.quantityType,
      bottleEmptyWeight: data.bottleEmptyWeight ?? null,
      bottleFullWeight: data.bottleFullWeight ?? null,
      quantityAvailable: 0,
      nrBottles: 0,
    },
  });

  return { message: "Produkt skapad", type: "success" as const };
});

export const updateDrinkItem = form(EditDrinkItemSchema, async (raw_data) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEM.UPDATE, locals.user);

  const data = raw_data as unknown as EditDrinkItemInput;

  await locals.prisma.drinkItem.update({
    where: { id: data.id },
    data: {
      name: data.name,
      systembolagetID: data.systembolagetID,
      group: data.group,
      price: Math.round(data.price * 100),
      quantityType: data.quantityType,
      bottleEmptyWeight: data.bottleEmptyWeight ?? null,
      bottleFullWeight: data.bottleFullWeight ?? null,
    },
  });

  return { message: "Produkt uppdaterad", type: "success" as const };
});

export const deleteDrinkItem = command(z.string().uuid(), async (id) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEM.DELETE, locals.user);

  try {
    await locals.prisma.drinkItem.delete({ where: { id } });
    return { message: "Produkt borttagen", type: "success" as const };
  } catch {
    return {
      message: "Produkten finns i loggar och kan inte tas bort",
      type: "error" as const,
    };
  }
});

export const createStockchange = form(StockchangeSchema, async (raw_data) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEMBATCH.CREATE, locals.user);

  const data = raw_data as unknown as StockchangeInput;
  const sign = data.type === "IN" ? 1 : -1;
  const qDelta = data.quantityDelta * sign;
  const bDelta = (data.nrBottlesDelta ?? 0) * sign;

  try {
    await locals.prisma.$transaction(async (tx) => {
      const product = await tx.drinkItem.findUnique({
        where: { id: data.drinkItemId },
      });

      if (!product) throw new Error("Produkten hittades inte");

      const newQ = (product.quantityAvailable ?? 0) + qDelta;
      const newB = (product.nrBottles ?? 0) + bDelta;

      if (newQ < 0 || newB < 0) {
        throw new Error("Lagersaldo kan inte bli negativt");
      }

      await tx.drinkItemBatch.create({
        data: {
          drinkItemId: data.drinkItemId,
          quantityDelta: qDelta,
          nrBottlesDelta: bDelta,
          date: dayjs(data.date).toDate(),
          user: locals.user?.studentId || "unknown",
        },
      });

      await tx.drinkItem.update({
        where: { id: data.drinkItemId },
        data: {
          quantityAvailable: newQ,
          nrBottles: newB,
        },
      });
    });
    return { message: "Lagersaldo uppdaterat", type: "success" as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ett okänt fel inträffade";
    return { message, type: "error" as const };
  }
});

export const updateLog = form(UpdateLogSchema, async (raw_data) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEMBATCH.UPDATE, locals.user);

  const data = raw_data as unknown as UpdateLogInput;

  try {
    await locals.prisma.$transaction(async (tx) => {
      const log = await tx.drinkItemBatch.findUnique({
        where: { id: data.id },
        include: { item: true },
      });

      if (!log) throw new Error("Loggrad hittades inte");

      // Calculate difference between old delta and new delta
      const qDiff = data.quantityDelta - log.quantityDelta;
      const bDiff = (data.nrBottlesDelta ?? 0) - (log.nrBottlesDelta ?? 0);

      const newQ = (log.item.quantityAvailable ?? 0) + qDiff;
      const newB = (log.item.nrBottles ?? 0) + bDiff;

      if (newQ < 0 || newB < 0) {
        throw new Error("Totalt lagersaldo kan inte bli negativt");
      }

      await tx.drinkItemBatch.update({
        where: { id: data.id },
        data: {
          quantityDelta: data.quantityDelta,
          nrBottlesDelta: data.nrBottlesDelta,
        },
      });

      await tx.drinkItem.update({
        where: { id: log.drinkItemId },
        data: {
          quantityAvailable: newQ,
          nrBottles: newB,
        },
      });
    });
    return { message: "Loggrad uppdaterad", type: "success" as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ett okänt fel inträffade";
    return { message, type: "error" as const };
  }
});

export const deleteLog = command(z.string().uuid(), async (id) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEMBATCH.DELETE, locals.user);

  try {
    await locals.prisma.$transaction(async (tx) => {
      const log = await tx.drinkItemBatch.findUnique({
        where: { id },
        include: { item: true },
      });

      if (!log) throw new Error("Loggrad hittades inte");

      // We subtract the log's delta from the product balance
      const newQ = (log.item.quantityAvailable ?? 0) - log.quantityDelta;
      const newB = (log.item.nrBottles ?? 0) - (log.nrBottlesDelta ?? 0);

      if (newQ < 0 || newB < 0) {
        throw new Error("Borttagning av loggen gör lagersaldot negativt");
      }

      await tx.drinkItem.update({
        where: { id: log.drinkItemId },
        data: {
          quantityAvailable: newQ,
          nrBottles: newB,
        },
      });

      await tx.drinkItemBatch.delete({ where: { id } });
    });
    return { message: "Loggrad borttagen", type: "success" as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ett okänt fel inträffade";
    return { message, type: "error" as const };
  }
});

export const uploadCSV = form(CSVSchema, async (raw_data) => {
  const { locals } = getRequestEvent();
  authorize(apiNames.DRINKITEM.CREATE, locals.user);

  const data = raw_data as unknown as CSVInput;
  const items = await readCSV(locals.prisma, data.file);

  for (const item of items) {
    await locals.prisma.drinkItem.create({
      data: {
        name: item.name,
        price: item.price * 100, // convert SEK to cents
        group: item.group,
        systembolagetID: item.systembolagetId,
        quantityType: item.quantityType,
        bottleEmptyWeight: item.bottleEmptyWeight ?? null,
        bottleFullWeight: item.bottleFullWeight ?? null,
        quantityAvailable: 0,
        nrBottles: 0,
      },
    });
  }

  return { message: "CSV inläst framgångsrikt", type: "success" as const };
});
