import prisma from "$lib/utils/prisma";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
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
