import authorisedPrismaClient from "$lib/server/authorizedPrisma";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const currentDate = new Date().toISOString();

  const alarmActiveEvent = await authorisedPrismaClient.event.findFirst({
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
