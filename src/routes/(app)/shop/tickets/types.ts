import type { Event, Shoppable, Tag, Ticket } from "@prisma/client";

export type TicketWithEvent = Ticket & {
  shoppable: Shoppable & {
    _count: {
      consumables: number;
    };
  };
  event: Event & {
    tags: Tag[];
  };
};
