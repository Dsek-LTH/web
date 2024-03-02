import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (request) => {
  const { prisma, user } = request.locals;
  if (!user) {
    error(401, "Not logged in");
  }
  const classProgramme = request.url.searchParams.get("classProgramme");
  if (!classProgramme) {
    error(400, "Invalid programme");
  }
  const classYear = parseInt(
    request.url.searchParams.get("classYear") ?? "NaN",
  );
  if (isNaN(classYear)) {
    error(400, "Invalid year");
  }
  const members = await prisma.member.findMany({
    where: {
      classProgramme,
      classYear,
    },
    orderBy: [
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
  };
};
