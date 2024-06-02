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
): Map<Member["id"], Set<Semester>> =>
  mandates.reduce((acc, curr) => {
    const set = acc.get(curr.memberId) ?? new Set<Semester>();

    for (const s of coveredSemesters(curr.startDate, curr.endDate))
      if (s <= now) set.add(s);

    acc.set(curr.memberId, set);

    return acc;
  }, new Map<Member["id"], Set<Semester>>());

const getSemesters = (mandates: Mandate[]): Semester[] => [
  ...mandates.reduce((acc, curr) => {
    coveredSemesters(curr.startDate, curr.endDate).forEach((x) => acc.add(x));
    return acc;
  }, new Set<Semester>()),
];

const getMembers = async (
  prisma: PrismaClient,
  ids: Array<Member["id"]>,
): Promise<Member[]> =>
  await prisma.member.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

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

const volunteerMedalSemester = (
  volunteerSemesters: Semester[],
): Semester | undefined => volunteerSemesters.toSorted()[1];

const committeeMedalSemester = (
  committeeSemesters: Semester[],
): Semester | undefined => committeeSemesters.toSorted()[5];

const gammalOchÄckligSemester = (
  boardSemesters: Semester[],
  volunteerSemesters: Semester[],
): Semester | undefined => {
  if (
    !(
      volunteerSemesters.length >= 8 ||
      (volunteerSemesters.length >= 6 && boardSemesters.length >= 2)
    )
  )
    return undefined;
  const vs = volunteerSemesters.toSorted();
  const bs = boardSemesters.toSorted();
  const b = bs[1];
  return b !== undefined ? vs[Math.min(7, Math.max(vs.indexOf(b), 5))] : vs[7];
};

export const memberMedals = async (
  prisma: PrismaClient,
  memberId: Member["id"],
  after: Semester,
): Promise<Array<{ medal: string; after: Semester }>> => {
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

  const volunteerSems = getSemesters(mandates).filter((x) => x <= after);
  const boardSems = getSemesters(
    mandates.filter((x) => x.position.boardMember),
  ).filter((x) => x <= after);

  const committeeSems = (await committeesWithMedals(prisma))
    .map((committee) => {
      const id = committee.id;

      const committeeMandates = mandates.filter(
        (x) => x.position.committeeId === id,
      );

      return {
        medal: "Utskottsmedalj — " + committee.name,
        after: getSemesters(committeeMandates)
          .filter((x) => x <= after)
          .toSorted()[5],
      };
    })
    .filter(
      (x): x is { medal: string; after: Semester } => x.after !== undefined,
    );

  const volunteerMedalSem = volunteerMedalSemester(volunteerSems);
  const gammalOchÄckligSem = gammalOchÄckligSemester(boardSems, volunteerSems);

  const res: Array<{ medal: string; after: Semester }> = [];

  if (volunteerMedalSem)
    res.push({
      medal: "Funktionärsmedalj",
      after: volunteerMedalSem,
    });

  if (gammalOchÄckligSem)
    res.push({
      medal: "Gammal && Äcklig",
      after: gammalOchÄckligSem,
    });

  return res.concat(committeeSems);
};

export const medalRecipients = async (
  prisma: PrismaClient,
  after: Semester,
): Promise<Array<{ medal: string; recipients: Member[] }>> => {
  const mandatesInAfter = await prisma.mandate.findMany({
    where: {
      startDate: {
        lt: endDate(after),
      },
      endDate: {
        gte: startDate(after),
      },
    },
  });

  const memberIds = mandatesInAfter.map((x) => x.memberId);

  const allMandates = await prisma.mandate.findMany({
    where: {
      memberId: {
        in: memberIds,
      },
      startDate: {
        lt: endDate(after),
      },
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

  const volunteerSemesters = countMandateSemesters(allMandates, after);
  const boardSemesters = countMandateSemesters(
    allMandates.filter((x) => x.position.boardMember),
    after,
  );

  const res = [];
  const volunteerMedalRecipients = memberIds.filter(
    (id) =>
      volunteerMedalSemester([...(volunteerSemesters.get(id) ?? [])]) === after,
  );

  if (volunteerMedalRecipients.length > 0)
    res.push({
      medal: "Funktionärsmedalj",
      recipients: await getMembers(prisma, volunteerMedalRecipients),
    });

  const gammalOchÄckligRecipients = memberIds.filter(
    (id) =>
      gammalOchÄckligSemester(
        [...(boardSemesters.get(id) ?? [])],
        [...(volunteerSemesters.get(id) ?? [])],
      ) === after,
  );

  if (gammalOchÄckligRecipients.length > 0)
    res.push({
      medal: "Gammal && Äcklig",
      recipients: await getMembers(prisma, gammalOchÄckligRecipients),
    });

  const committees = await committeesWithMedals(prisma);

  const committeeMedalRecipients = (
    await Promise.all(
      committees.map(async (committee) => {
        const committeeMandates = allMandates.filter(
          (x) => x.position.committeeId === committee.id,
        );

        const committeeSemesters = countMandateSemesters(
          committeeMandates,
          after,
        );

        const recipients = memberIds.filter(
          (id) =>
            committeeMedalSemester([...(committeeSemesters.get(id) ?? [])]) ===
            after,
        );

        return recipients.length < 1
          ? []
          : [
              {
                medal: "Utskottsmedalj — " + committee.name,
                recipients: await getMembers(prisma, recipients),
              },
            ];
      }),
    )
  ).flat();

  return res.concat(committeeMedalRecipients);
};
