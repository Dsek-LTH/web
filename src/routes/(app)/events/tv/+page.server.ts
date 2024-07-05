import { getAllEvents } from "../events";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const [events] = await getAllEvents(prisma);
  return {
    events,
  };
};
