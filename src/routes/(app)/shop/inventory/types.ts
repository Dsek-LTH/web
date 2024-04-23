import { ShoppableType } from "@prisma/client";
import type { Consumable, Event, Shoppable, Ticket } from "@prisma/client";

export type TicketShoppable = Omit<Shoppable, "type"> & {
  type: (typeof ShoppableType.TICKET);
} & Ticket & {
    event: Event;
  };
// Can have other types of shoppables
export type ConsumableWithMoreInfo = Consumable & {
  shoppable: TicketShoppable;
};
