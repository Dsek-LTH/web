import type { PageServerLoad } from "./$types";
import { type Semester } from "$lib/utils/semesters";
import { medalRecipients } from "$lib/server/medals/medals";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester = getSemesterOrThrowSvelteError(url);

  const recipients = await medalRecipients(prisma, semester);

  return {
    recipients,
  };
};
