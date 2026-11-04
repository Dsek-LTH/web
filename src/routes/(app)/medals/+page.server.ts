import type { PageServerLoad } from "./$types";
import type { Semester } from "$lib/utils/semesters";
import { medalRecipients } from "$lib/server/medals/medals";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url.server";
import {
  dateToSemester,
  FIRST_MEDALS_SEMESTER,
  isMedalsSemester,
} from "$lib/utils/semesters";
import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester = getSemesterOrThrowSvelteError(url);
  const now = new Date();
  if (!isMedalsSemester(semester, now)) {
    throw error(400, m.error_invalid_semester());
  }

  const recipients = await medalRecipients(prisma, semester);

  return {
    recipients,
    semester,
    minSemester: FIRST_MEDALS_SEMESTER,
    maxSemester: dateToSemester(now),
  };
};
