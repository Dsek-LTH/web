import type { RequestHandler } from "./$types";
import { z } from "zod";

const closeAlert = z.object({
  id: z.string(),
});

export const POST: RequestHandler = async ({ request, locals }) => {
  const { prisma } = locals;

  const json = await request.json();

  const alert = closeAlert.parse(json);

  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      closedByMember: { connect: { id: locals.user?.memberId } },
    },
  });

  return new Response();
};
