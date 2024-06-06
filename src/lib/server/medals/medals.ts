import type { PrismaClient, Member, Mandate, Committee } from "@prisma/client";
import {
  type Semester,
  startDate,
  endDate,
  coveredSemesters,
} from "$lib/utils/semesters";
import { languageTag } from "$paraglide/runtime";
import * as m from "$paraglide/messages";

/**
 * Counts what semesters different members had mandates on.
 *
 * @param mandates - The list of mandates to count.
 * @param now - The latest semester to count.
 * @returns A map from member ids to the set of semesters that the mandates in
 * `mandates` belonging to them cover.
 */
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

/**
 * Get what semesters are covered by a collection of mandates.
 *
 * @param mandates - The collection of mandates.
 * @returns An array of the semesters covered by at least one of the mandates in
 * `mandates`.
 */
const getSemesters = (mandates: Mandate[]): Semester[] => [
  ...mandates.reduce((acc, curr) => {
    coveredSemesters(curr.startDate, curr.endDate).forEach((x) => acc.add(x));
    return acc;
  }, new Set<Semester>()),
];

/**
 * Fetch the corresponding Member objects to a collection of member IDs from
 * prisma.
 *
 * @param prisma - The prisma client to query.
 * @param ids - The array of ids to query for.
 * @returns An array of the Member objects corresponding to `ids`.
 */
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

/**
 * Fetch the committees that have a committee medal from prisma.
 *
 * @param prisma - The prisma client to query.
 * @returns An array of the Committees that have committee medals.
 */
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

/**
 * Calculate after which semester a volunteer should have been awarded their
 * volunteer medal from the semesters they have volunteered.
 *
 * @param volunteerSemesters - The semesters that the volunteer has volunteered.
 * @returns The semester after which the volunteer should have been awarded
 * their volunteer medal, or `undefined` if they should not have been awarded
 * one (yet).
 */
const volunteerMedalSemester = (
  volunteerSemesters: Semester[],
): Semester | undefined => volunteerSemesters.toSorted()[1];

/**
 * Calculate after which semester a volunteer should have been awarded a
 * committee medal from the semesters they have volunteered for that committee.
 *
 * @param volunteerSemesters - The semesters that the volunteer has volunteered
 * for a certain committee.
 * @returns The semester after which the volunteer should have been awarded
 * their committee medal for that committee, or `undefined` if they should not
 * have been awarded one (yet).
 */
const committeeMedalSemester = (
  committeeSemesters: Semester[],
): Semester | undefined => committeeSemesters.toSorted()[5];

/**
 * Calculate after which semester a volunteer should have been awarded *Gammal
 * && Äcklig* from the semesters they have volunteered and the semesters they
 * have been on the board.
 *
 * @param boardSemesters - The semesters that the volunteer been on the board.
 * @param volunteerSemesters - The semesters that the volunteer has volunteered
 * for a certain committee.
 * @returns The semester after which the volunteer should have been awarded
 * Gammal && Äcklig, or `undefined` if they should not have been awarded it
 * (yet).
 */
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

/**
 * Format the name of the committee medal for a certain committee. Takes
 * paraglide language into account.
 *
 * @param committee - The committee.
 * @returns a string with the name.
 */
const committeeMedalName = (committee: Committee): string =>
  m.medals_committeeMedal() +
  " — " +
  (languageTag() === "sv" ? committee.name : committee.nameEn);

/**
 * Calculate after which semesters a certain member deserved their different
 * medals. Right now, the medals that are reported are:
 * - volunteer medal
 * - Gammal && Äcklig
 * - committee medals (for the committees given by `committeesWithMedals`)
 *
 * @param prisma - The prisma client to query for mandates and committees.
 * @param memberId - The ID of the member to check medals for.
 * @param after - The last semester to check for.
 * @returns An array of objects containing the name of the medal and the
 * semester after which they should have been awarded the medal.
 */
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
        medal: committeeMedalName(committee),
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
      medal: m.medals_volunteerMedal(),
      after: volunteerMedalSem,
    });

  if (gammalOchÄckligSem)
    res.push({
      medal: m.medals_gammalOchÄcklig(),
      after: gammalOchÄckligSem,
    });

  return res.concat(committeeSems);
};

/**
 * Calculate who should earn what medals after a particular semester.  Right
 * now, the medals that are reported are:
 * - volunteer medal
 * - Gammal && Äcklig
 * - committee medals (for the committees given by `committeesWithMedals`)
 *
 * @param prisma - The prisma client to query for mandates and committees.
 * @param after - The last semester to check for.
 * @returns An array of objects containing the name of the medal and the
 * an array of members that should have recived that medal after `after`.
 */
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
      medal: m.medals_volunteerMedal(),
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
      medal: m.medals_gammalOchÄcklig(),
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
                medal: committeeMedalName(committee),
                recipients: await getMembers(prisma, recipients),
              },
            ];
      }),
    )
  ).flat();

  return res.concat(committeeMedalRecipients);
};
