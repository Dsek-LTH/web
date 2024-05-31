import type { PrismaClient, Member, Mandate, Committee } from "@prisma/client";
import {
  type Semester,
  startDate,
  endDate,
  coveredSemesters,
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

const memberIdsWithMandates = async (
  prisma: PrismaClient,
  semester: Semester,
  committeeIds: string[] | null = null,
): Promise<string[]> => {
  const where = {
    startDate: {
      lt: endDate(semester),
    },
    endDate: {
      gte: startDate(semester),
    },
  };

  // NOTE: here we mutate the where object!
  if (committeeIds !== null) {
    Object.assign(where, {
      position: {
        committee: {
          id: {
            in: committeeIds,
          },
        },
      },
    });
  }

  return (
    await prisma.mandate.findMany({
      select: {
        memberId: true,
      },

      where: where,
    })
  ).map((x) => x.memberId);
};

const mandatesBeforeSemester = async (
  prisma: PrismaClient,
  memberIds: string[],
  semester: Semester,
): Promise<Mandate[]> =>
  await prisma.mandate.findMany({
    where: {
      memberId: {
        in: memberIds,
      },
      startDate: {
        lt: endDate(semester),
      },
    },
  });

export const volonteerMedalRecipients = async (
  prisma: PrismaClient,
  semester: Semester,
): Promise<Member[]> => {
  const idsToSemesters: Array<[string, Set<Semester>]> = countMandateSemesters(
    await mandatesBeforeSemester(
      prisma,
      await memberIdsWithMandates(prisma, semester),
      semester,
    ),
    semester,
  );

  const ids: string[] = idsToSemesters
    .filter((x) => x[1].size == 2) // Two semesters of volonteering
    .map((x) => x[0]);

  return await getMembers(prisma, ids);
};

const boardSemesters = async (
  prisma: PrismaClient,
  memberIds: string[],
  semester: Semester,
): Promise<Map<string, Set<Semester>>> =>
  new Map<string, Set<Semester>>(
    countMandateSemesters(
      await prisma.mandate.findMany({
        where: {
          memberId: {
            in: memberIds,
          },
          position: {
            boardMember: true,
          },
        },
      }),
      semester,
    ),
  );

export const gammalOchÄckligRecipients = async (
  prisma: PrismaClient,
  semester: Semester,
): Promise<Member[]> => {
  const bSemesters = await boardSemesters(
    prisma,
    await memberIdsWithMandates(prisma, semester),
    semester,
  );

  const idsToSemesters: Array<[string, Set<Semester>]> = countMandateSemesters(
    await mandatesBeforeSemester(
      prisma,
      await memberIdsWithMandates(prisma, semester),
      semester,
    ),
    semester,
  );

  const ids = idsToSemesters
    .filter((x) => {
      {
        // Set of semesters on the board
        const boardSems = bSemesters.get(x[0]);
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
      }
    })
    .map((x) => x[0]);

  return getMembers(prisma, ids);
};

export const committeeMedalRecipients = async (
  prisma: PrismaClient,
  committeeId: string,
  semester: Semester,
): Promise<Member[]> => {
  const membersWithCommitteeMandates = await memberIdsWithMandates(
    prisma,
    semester,
    [committeeId],
  );

  const ids = countMandateSemesters(
    await prisma.mandate.findMany({
      where: {
        memberId: {
          in: membersWithCommitteeMandates,
        },
        position: {
          committee: {
            id: committeeId,
          },
        },
      },
    }),
    semester,
  )
    .filter((y) => y[1].size === 6)
    .map((y) => y[0]);

  return await getMembers(prisma, ids);
};

const committeesWithMedals = async (
  prisma: PrismaClient,
): Promise<Committee[]> =>
  await prisma.committee.findMany({
    where: {
      NOT: {
        shortName: {
          in: ["valb", "other", "dchip", "medalj"],
        },
      },
    },
  });

const committeeRecipients = async (
  prisma: PrismaClient,
  committees: Committee[],
  semester: Semester,
): Promise<Array<[string, Member[]]>> =>
  await Promise.all(
    committees
      .sort((a, b) => (a.name === b.name ? 0 : a.name < b.name ? -1 : 1))
      .map(async (x) => [
        `Utskottsmedalj — ${x.name}`,
        await committeeMedalRecipients(prisma, x.id, semester),
      ]),
  );

export const allMedalRecipients = async (
  prisma: PrismaClient,
  semester: Semester,
): Promise<Array<[string, Member[]]>> =>
  [
    ["Volonteer medal", await volonteerMedalRecipients(prisma, semester)],
    ["Gammal && Äcklig", await gammalOchÄckligRecipients(prisma, semester)],
    ...(await committeeRecipients(
      prisma,
      await committeesWithMedals(prisma),
      semester,
    )),
  ].filter((x): x is [string, Member[]] => (x[1] ?? []).length > 0);

// Medals for individuals

const getSemesters = (mandates: Mandate[]): Semester[] => [
  ...mandates.reduce((acc, curr) => {
    coveredSemesters(curr.startDate, curr.endDate).forEach((x) => acc.add(x));
    return acc;
  }, new Set<Semester>()),
];

const gammalOchÄckligSemester = (
  boardSemesters: Semester[],
  volonteerSemesters: Semester[],
): Semester | undefined => {
  if (
    !(
      volonteerSemesters.length >= 8 ||
      (volonteerSemesters.length <= 6 && boardSemesters.length <= 2)
    )
  )
    return undefined;
  const vs = volonteerSemesters.toSorted();
  const bs = boardSemesters.toSorted();
  const b = bs[1];
  return b !== undefined ? vs[Math.min(7, Math.max(vs.indexOf(b), 5))] : vs[7];
};

export const memberMedals = async (
  prisma: PrismaClient,
  memberId: Member["id"],
  after: Semester,
): Promise<Array<[string, Semester]>> => {
  const mandates = await prisma.mandate.findMany({
    where: {
      memberId: memberId,
    },
    include: {
      position: {
        select: {
          boardMember: true,
          committeeId: true,
        },
      },
    },
  });

  const volonteerSems = getSemesters(mandates).filter((x) => x <= after);
  const boardSems = getSemesters(
    mandates.filter((x) => x.position.boardMember),
  ).filter((x) => x <= after);

  const committeeSems = (await committeesWithMedals(prisma))
    .map((committee) => {
      const id = committee.id;

      const committeeMandates = mandates.filter(
        (x) => x.position.committeeId === id,
      );

      return [
        "Ustkottsmedalj — " + committee.name,
        getSemesters(committeeMandates)
          .filter((x) => x <= after)
          .toSorted()[5],
      ] as const;
    })
    .filter((x): x is [string, Semester] => !!x[1]);

  const volonteerMedalSem = volonteerSems.toSorted()[1];
  const gammalOchÄckligSem = gammalOchÄckligSemester(volonteerSems, boardSems);

  const res: Array<[string, Semester]> = [];

  if (volonteerMedalSem) res.push(["Funktionärsmedalj", volonteerMedalSem]);

  if (gammalOchÄckligSem) res.push(["Gammal && Äcklig", gammalOchÄckligSem]);

  return res.concat(committeeSems);
};
