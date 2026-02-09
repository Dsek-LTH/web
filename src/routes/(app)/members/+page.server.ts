import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

const allowedProgrammes = ["D", "C", "VR/AR"];

export const load: PageServerLoad = async (request) => {
  const { prisma, user } = request.locals;
  if (!user?.memberId) {
    error(401, m.members_errors_notLoggedIn());
  }
  let classProgramme = request.url.searchParams.get("programme");
  if (!classProgramme || !allowedProgrammes.includes(classProgramme)) {
    classProgramme = "all";
  }
  const classYear = getYearOrThrowSvelteError(request.url);
  const members = await prisma.member.findMany({
    where: {
      classYear,
      classProgramme: classProgramme === "all"
        ? {
          // dont actually show ALL members in db, only those in the specified programmes
          // we have some members for other programmes, but they are not part of the guild
          in: allowedProgrammes,
        }
        : {
          equals: classProgramme,
        },
    },
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
      {
        classProgramme: "asc",
      },
    ],
  });

  return {
    members,
    programme: classProgramme,
    year: classYear,
  };
};
