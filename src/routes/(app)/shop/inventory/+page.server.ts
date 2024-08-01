import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { dbIdentification } from "$lib/server/shop/types";
import * as m from "$paraglide/messages";
import type { ConsumableWithMoreInfo } from "./types";
import { ShoppableType } from "@prisma/client";

export const load: PageServerLoad = async ({ locals, depends }) => {
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
