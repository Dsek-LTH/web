import { type Semester, toString } from "$lib/utils/semesters";
import { medalRecipients } from "$lib/server/medals/medals";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url.server";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import * as messages from "$paraglide/messages";

export const GET = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester = getSemesterOrThrowSvelteError(url);

  const recipientLines: string[] = (
    await medalRecipients(prisma, semester)
  ).flatMap((x) =>
    x.recipients.map((y) => {
      const medal: string = x.medal;
      const member: ExtendedPrismaModel<"Member"> = y;
      return [
        `${member.firstName} ${member.lastName}`.replace(",", ""),
        member.studentId,
        medal,
      ].join(",");
    }),
  );

  const csv: string = [messages.medals_csvHeader(), ...recipientLines].join(
    "\n",
  );

  // return csv as file
  const res = new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=medals-${toString(
        semester,
      ).replace(" ", "-")}.csv`,
    },
  });
  return res;
};
