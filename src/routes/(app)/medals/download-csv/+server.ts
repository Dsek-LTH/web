import { type Semester, toString } from "$lib/utils/semesters";
import { medalRecipients } from "$lib/server/medals/medals";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url.server";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

export const GET = async ({ locals, url }) => {
  const { prisma, user } = locals;

  authorize(apiNames.MEDALS.MANAGE, user);

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

  const csv: string = ["Namn,StilID,Medalj", ...recipientLines].join("\n");

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
