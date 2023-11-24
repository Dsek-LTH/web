import prisma from "$lib/utils/prisma.js";

export const load = async () => {
  const meetings = await prisma.meeting.findMany({
    orderBy: {
      start: "desc",
    },
  });
  return {
    meetings,
  };
};
