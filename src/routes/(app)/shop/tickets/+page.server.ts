import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getTickets } from "$lib/server/shop/getTickets";
import { ticketPageActions } from "$lib/server/shop/tickets/actions";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { user, prisma } = locals;

  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) error(401);
  depends("tickets");
  const identification = memberId
    ? {
        memberId: memberId,
      }
    : {
        externalCode: externalCode!,
      };
  const allTickets = await getTickets(prisma, identification);
  if (locals.isApp && memberId) {
    const shopItemCounts = await countUserShopItems(prisma, user);
    return {
      shopItemCounts,
      tickets: allTickets,
    };
  }

  return {
    tickets: allTickets,
  };
};

export const actions = ticketPageActions();
