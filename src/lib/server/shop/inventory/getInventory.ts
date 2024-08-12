import { dbIdentification } from "$lib/server/shop/types";
import * as m from "$paraglide/messages";
import { ShoppableType } from "@prisma/client";
import { error, type ServerLoadEvent } from "@sveltejs/kit";
import type { ConsumableWithMoreInfo } from "./types";

export const inventoryLoadFunction = async ({
  locals,
  depends,
}: ServerLoadEvent) => {
  const { prisma, user } = locals;

  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) {
    error(401, m.inventory_errors_unauthorized());
  }
  depends("consumables");
  const userId = dbIdentification(
    memberId
      ? {
          memberId,
        }
      : {
          externalCode: externalCode!,
        },
  );
  const consumables = await prisma.consumable.findMany({
    where: {
      ...userId,
      purchasedAt: {
        not: null,
        lte: new Date(),
      },
    },
    orderBy: {
      purchasedAt: "desc",
    },
    include: {
      shoppable: {
        include: {
          ticket: {
            include: { event: true },
          },
        },
      },
    },
  });
  const consumablesWithMoreInfo: ConsumableWithMoreInfo[] = consumables.map(
    (consumable) => {
      if (consumable.shoppable.type !== ShoppableType.TICKET) {
        throw new Error(m.errors_notImplemented());
      }
      return {
        ...consumable,
        shoppable: {
          ...consumable.shoppable,
          ...consumable.shoppable.ticket!,
          event: consumable.shoppable.ticket!.event,
        },
      };
    },
  );
  return {
    consumables: consumablesWithMoreInfo,
  };
};

export const inventoryItemLoadFunction = async ({
  locals,
  depends,
  params,
}: ServerLoadEvent<{ id: string }>) => {
  const { prisma, user } = locals;

  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) {
    error(401, m.inventory_errors_unauthorized());
  }
  const userId = dbIdentification(
    memberId
      ? {
          memberId,
        }
      : {
          externalCode: externalCode!,
        },
  );
  depends("consumables");
  const consumable = await prisma.consumable.findUnique({
    where: {
      ...userId,
      id: params.id,
      purchasedAt: {
        not: null,
        lte: new Date(),
      },
    },
    include: {
      questionResponses: {
        include: {
          question: true,
        },
      },
      shoppable: {
        include: {
          ticket: {
            include: { event: true },
          },
        },
      },
    },
  });
  if (!consumable) {
    error(404, m.inventory_errors_consumableNotFound());
  }
  return {
    consumable: {
      ...consumable,
      shoppable: {
        ...consumable.shoppable,
        ...consumable.shoppable.ticket!,
        event: consumable.shoppable.ticket!.event,
      },
    },
  };
};

export type InventoryLoadData = Awaited<
  ReturnType<typeof inventoryLoadFunction>
>;
export type InventoryItemLoadData = Awaited<
  ReturnType<typeof inventoryItemLoadFunction>
>;
