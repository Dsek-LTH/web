import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

const allowedPrograms = ["D", "C", "VR/AR"];

export const load: PageServerLoad = async (request) => {
  const { prisma, user } = request.locals;
  if (!user?.memberId) {
    error(401, m.members_errors_notLoggedIn());
  }
  let classProgram = request.url.searchParams.get("program");
  if (!classProgram || !allowedPrograms.includes(classProgram)) {
    classProgram = "all";
  }
  const classYear = getYearOrThrowSvelteError(request.url);
  const members = await prisma.member.findMany({
    where: {
      classYear,
      classProgramme:
        classProgram === "all"
          ? {
              // dont actually show ALL members in db, only those in the specified programs
              // we have some members for other programs, but they are not part of the guild
              in: allowedPrograms,
            }
          : {
              equals: classProgram,
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
    program: classProgram,
    year: classYear,
  };
};
