import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const { prisma } = locals;
  const currentDate = new Date().toISOString();

  const alarmActiveEvent = await prisma.event.findFirst({
    where: {
      alarmActive: true,
      startDatetime: {
        lte: currentDate,
      },
      endDatetime: {
        gt: currentDate,
      },
    },
  });

  const alarmOn = alarmActiveEvent == null ? "false" : "true";

  return new Response(alarmOn);
};
