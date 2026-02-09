import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import type { ShoppableType } from "@prisma/client";

export type TicketShoppable =
  & Omit<ExtendedPrismaModel<"Shoppable">, "type">
  & {
    type: typeof ShoppableType.TICKET;
  }
  & ExtendedPrismaModel<"Ticket">
  & {
    event: ExtendedPrismaModel<"Event">;
  };
// Can have other types of shoppables
export type ConsumableWithMoreInfo = ExtendedPrismaModel<"Consumable"> & {
  shoppable: TicketShoppable;
};
