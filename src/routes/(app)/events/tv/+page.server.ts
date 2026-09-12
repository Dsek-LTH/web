import { getEvents } from "$lib/events/getEvents";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const [events] = await getEvents(prisma);
  return {
    events,
  };
};
