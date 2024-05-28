import type { PageServerLoad } from "./$types";
import type { PrismaClient, Member, Mandate, Committee } from "@prisma/client";
import {
  type Semester,
  startDate,
  endDate,
  coveredSemesters,
  dateToSemester,
  parseSemester,
} from "./semesters";

const countMandateSemesters = (
  mandates: Mandate[],
  now: Semester,
): Array<[string, Set<Semester>]> =>
  [
    ...mandates
      .reduce(
        (acc, curr) =>
          acc.set(
            curr.memberId,
            (acc.get(curr.memberId) ?? new Set<Semester>()).union(
              coveredSemesters(curr.startDate, curr.endDate),
            ),
          ),
        new Map<string, Set<Semester>>(),
      )
      .entries(),
  ].map((x) => [
    x[0],
    // Semesters before and including now
    new Set([...x[1]].filter((y) => y <= now)),
  ]);

const getMembers = async (
  prisma: PrismaClient,
  ids: string[],
): Promise<Member[]> =>
  await prisma.member.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;

  const semester: Semester =
    parseSemester(url.searchParams.get("semester") ?? "") ||
    dateToSemester(new Date());

  const membersWithMandatesInSemester = await prisma.mandate.findMany({
    select: {
      memberId: true,
    },

    where: {
      startDate: {
        lt: endDate(semester),
      },
      endDate: {
        gte: startDate(semester),
      },
    },
  });

  const allTheirMandatesBeforeNow = await prisma.mandate.findMany({
    where: {
      memberId: {
        in: membersWithMandatesInSemester.map((x) => x.memberId),
      },
      startDate: {
        lt: endDate(semester),
      },
    },
  });

  const semestersOfVolonteering: Array<[string, Set<Semester>]> =
    countMandateSemesters(allTheirMandatesBeforeNow, semester);

  // Volonteer medal

  const volonteerRecipientIds: string[] = semestersOfVolonteering
    // Take those who have exacltly two semesters of volonteering
    .filter((x) => x[1].size == 2)
    .map((x) => x[0]);

  // Gammal && Äcklig

  const boardMandates = await prisma.mandate.findMany({
    where: {
      memberId: {
        in: membersWithMandatesInSemester.map((x) => x.memberId),
      },
      position: {
        boardMember: true,
      },
    },
  });

  const boardSemesters = new Map<string, Set<Semester>>(
    countMandateSemesters(boardMandates, semester),
  );

  const gammalOchÄckligRecipientIds: string[] = semestersOfVolonteering
    .filter((x) => {
      // Set of semesters on the board
      const boardSems = boardSemesters.get(x[0]);
      // Number of semesters volonteering
      const volonteerTime = x[1].size;
      if (boardSems && boardSems.size > 1) {
        if (volonteerTime === 6) return true;
        else if (
          boardSems.size == 2 &&
          (volonteerTime === 7 || volonteerTime === 8)
        )
          return boardSems.has(semester);
      } else {
        // Never been on the board
        return volonteerTime === 8;
      }
    })
    .map((x) => x[0]);

  // Committee medals

  const committeesWithMedals: Committee[] = await prisma.committee.findMany({
    where: {
      NOT: {
        shortName: {
          in: ["valb", "other", "dchip", "medalj"],
        },
      },
    },
  });

  const committeeMedals: Array<[string, string[]]> = await Promise.all(
    committeesWithMedals
      .sort((a, b) => (a.name === b.name ? 0 : a.name < b.name ? -1 : 1))
      .map(async (x) => {
        const membersWithCommitteeMandatesInSemester =
          await prisma.mandate.findMany({
            select: {
              memberId: true,
            },

            where: {
              position: {
                committee: {
                  id: x.id,
                },
              },
              startDate: {
                lt: endDate(semester),
              },
              endDate: {
                gte: startDate(semester),
              },
            },
          });

        return [
          "Utskottsmedalj: " + x.name,
          countMandateSemesters(
            await prisma.mandate.findMany({
              where: {
                memberId: {
                  in: membersWithCommitteeMandatesInSemester.map(
                    (y) => y.memberId,
                  ),
                },
                position: {
                  committee: {
                    id: x.id,
                  },
                },
              },
            }),
            semester,
          )
            .filter((y) => y[1].size === 6)
            .map((y) => y[0]),
        ];
      }),
  );

  const recipients: Array<[string, Member[]]> = await Promise.all(
    [
      ["Volonteer medal", volonteerRecipientIds],
      ["Gammal && Äcklig", gammalOchÄckligRecipientIds],
      ...committeeMedals,
    ]
      .filter((x) => (x[1] ?? []).length != 0)
      .map(async (x) => [x[0] ?? "", await getMembers(prisma, x[1] ?? [])]),
  );

  return {
    recipients,
  };
};
