import type { Member } from "@prisma/client";
import { type Semester, toString } from "$lib/utils/semesters";
import { medalRecipients } from "$lib/server/medals/medals";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url.server";

export const GET = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester = getSemesterOrThrowSvelteError(url);

  const recipientLines: string[] = (
    await medalRecipients(prisma, semester)
  ).flatMap((x) =>
    x.recipients.map((y) => {
      const medal: string = x.medal;
      const member: Member = y;
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
