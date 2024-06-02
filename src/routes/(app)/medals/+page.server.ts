import type { PageServerLoad } from "./$types";
import {
  type Semester,
  dateToSemester,
  parseSemester,
} from "$lib/utils/semesters";
import { medalRecipients } from "$lib/utils/medals";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester =
    parseSemester(url.searchParams.get("semester") ?? "") ||
    dateToSemester(new Date());

  const recipients = await medalRecipients(prisma, semester);

  return {
    recipients,
  };
};
