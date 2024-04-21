import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: params.slug,
    },
    include: {
      event: true,
      shoppable: true,
    },
  });
  if (!ticket) error(404, "Denna biljett finns inte.");
  return { ticket };
};
