import type { PageServerLoad, Actions } from "./$types";
import { committeeActions } from "../committee.server";
import { scheduleActions, scheduleLoad } from "./schedule.server";

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  const { prisma } = locals;

  const openingHours = await prisma.markdown.findMany({
    where: {
      name: {
        startsWith: "cafe:open",
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return { ...(await scheduleLoad(event)), openingHours };
};

export const actions: Actions = {
  ...committeeActions("cafe"),
  ...scheduleActions(),
};
