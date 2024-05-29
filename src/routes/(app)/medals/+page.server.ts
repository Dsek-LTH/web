import type { PageServerLoad } from "./$types";
import { type Semester, dateToSemester, parseSemester } from "./semesters";
import { allMedalRecipients } from "./medals";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester =
    parseSemester(url.searchParams.get("semester") ?? "") ||
    dateToSemester(new Date());

  const recipients = await allMedalRecipients(prisma, semester);

  return {
    recipients,
  };
};
