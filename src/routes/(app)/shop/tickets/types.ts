import type { Event, Shoppable, Tag, Ticket } from "@prisma/client";

export type TicketWithEvent = Ticket & {
  shoppable: Shoppable;
  event: Event & {
    tags: Tag[];
  };
};
