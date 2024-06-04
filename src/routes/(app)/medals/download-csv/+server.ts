import type { Member } from "@prisma/client";
import {
  type Semester,
  toString,
  parseSemester,
  dateToSemester,
} from "$lib/utils/semesters";
import { medalRecipients } from "$lib/server/medals/medals";

export const GET = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester =
    parseSemester(url.searchParams.get("semester") ?? "") ||
    dateToSemester(new Date());

  const recipientLines: string[] = (
    await medalRecipients(prisma, semester)
  ).flatMap((x) =>
    x.recipients.map((y) => {
      const medal: string = x.medal;
      const member: Member = y;
      return [
        `${member.firstName} ${member.lastName}`.replace(",", ""), // Don't even trip
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
