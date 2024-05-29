import type { Member } from "@prisma/client";
import {
  type Semester,
  toString,
  parseSemester,
  dateToSemester,
} from "../semesters";
import { allMedalRecipients } from "../medals";

export const GET = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester =
    parseSemester(url.searchParams.get("semester") ?? "") ||
    dateToSemester(new Date());

  const recipientLines: string[] = (
    await allMedalRecipients(prisma, semester)
  ).flatMap((x) =>
    x[1].map((y) => {
      const medal: string = x[0];
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
