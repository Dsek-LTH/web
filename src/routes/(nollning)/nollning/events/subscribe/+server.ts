import { NOLLNING_TAG_PREFIX } from "$lib/components/postReveal/types.js";
import { generateICS } from "$lib/server/ics/calendar.js";
import dayjs from "dayjs";

export const GET = async ({ locals, setHeaders }) => {
  const { prisma } = locals;

  const events = await prisma.event.findMany({
    where: {
      tags: {
        some: {
          name: {
            startsWith: NOLLNING_TAG_PREFIX,
          },
        },
      },
      startDatetime: {
        gte: dayjs().subtract(1, "month").toDate(),
      },
      endDatetime: {
        lte: dayjs().add(3, "months").toDate(),
      },
    },
  });

  return generateICS(events, setHeaders);
};
