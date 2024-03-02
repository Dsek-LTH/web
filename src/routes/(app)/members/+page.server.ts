import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const allowedProgrammes = ["D", "C", "VR/AR"];

export const load: PageServerLoad = async (request) => {
  const { prisma, user } = request.locals;
  if (!user) {
    error(401, "Not logged in");
  }
  let classProgramme = request.url.searchParams.get("programme");
  if (!classProgramme || !allowedProgrammes.includes(classProgramme)) {
    classProgramme = "all";
  }
  let classYear = parseInt(request.url.searchParams.get("year") ?? "");
  if (isNaN(classYear)) {
    classYear = new Date().getFullYear();
  }
  const members = await prisma.member.findMany({
    where: {
      classYear,
      classProgramme:
        classProgramme === "all"
          ? {
              // dont actually show ALL members in db, only those in the specified programmes
              // we have some members for other programmes, but they are not part of the guild
              in: ["D", "C", "VR/AR"],
            }
          : {
              equals: classProgramme,
            },
    },
    orderBy: [
      {
        classProgramme: "asc",
      },
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  });

  return {
    members,
    programme: classProgramme,
    year: classYear,
  };
};
