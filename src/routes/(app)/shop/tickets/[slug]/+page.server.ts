import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getTicket } from "$lib/server/shop/getTickets";
import * as m from "$paraglide/messages";
// TODO: Cache

export const load: PageServerLoad = async ({ locals, params, depends }) => {
  const { prisma, user } = locals;
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
  const ticket = await getTicket(prisma, params.slug, identification);
  if (!ticket) error(404, m.tickets_errors_ticketNotFound());
  return { ticket };
};
