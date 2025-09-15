import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "./$types";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

/**
 * The arrays contain students and positions respectively.
 * Every door policy applies to either a studentId or a positionId.
 * This function splits the policies into two respective arrays.
 */
function parseDoorPolicies(
  policies: Array<
    Pick<ExtendedPrismaModel<"DoorAccessPolicy">, "studentId" | "role">
  >,
) {
  const studentIds = policies
    .map((policy) => policy.studentId)
    .filter((id): id is string => id !== null);
  const positionIds = policies
    .map((policy) => policy.role)
    .filter((id): id is string => id !== null);
  return { studentIds, positionIds };
}

/**
 * The arrays contain students and positions respectively with banned access to a door.
 * Every door policy applies to either a studentId or a positionId.
 * This function splits the policies into two respective arrays.
 */
function parseDoorBanPolicies(
  policies: Array<
    Pick<
      ExtendedPrismaModel<"DoorAccessPolicy">,
      "studentId" | "role" | "isBan"
    >
  >,
) {
  const studentIdsBanned = policies
    .filter((policy) => policy.isBan)
    .map((policy) => policy.studentId)
    .filter((id): id is string => id !== null);
  const positionIdsBanned = policies
    .filter((policy) => policy.isBan)
    .map((policy) => policy.role)
    .filter((id): id is string => id !== null);
  return { studentIdsBanned, positionIdsBanned };
}

/**
 * Given an array of role strings such as "dsek", "dsek.km", etc,
 * return an array of positions that match the input strings.
 */
function fetchMatchingPositions(positions: string[], prisma: PrismaClient) {
  return prisma.position.findMany({
    select: { id: true },
    where: {
      OR: positions.map((p) => ({
        id: {
          startsWith: `${p}%`,
        },
      })),
    },
  });
}

/**
 * Given an array of position IDs, return an array of
 * student IDs that are currently holding the positions.
 */
async function fetchStudentsWithPositions(
  positions: string[],
  prisma: PrismaClient,
) {
  const mandates = await prisma.mandate.findMany({
    where: {
      AND: [
        { positionId: { in: positions } },
        { startDate: { lte: new Date() } },
        { endDate: { gte: new Date() } },
      ],
    },
    select: {
      member: {
        select: {
          studentId: true,
        },
      },
    },
  });
  const studentIds = mandates.map((mandate) => mandate.member.studentId);
  return studentIds.filter((id): id is string => id !== null);
}

export const GET: RequestHandler = async ({ params }) => {
  try {
    const now = new Date().toISOString();
    const policies = await authorizedPrismaClient.doorAccessPolicy.findMany({
      select: {
        studentId: true,
        role: true,
        isBan: true,
      },
      where: {
        AND: [
          { doorName: params["door"] },
          {
            OR: [{ startDatetime: { lte: now } }, { startDatetime: null }],
          },
          {
            OR: [{ endDatetime: { gte: now } }, { endDatetime: null }],
          },
        ],
      },
    });

    const { studentIds, positionIds } = parseDoorPolicies(policies);
    const { studentIdsBanned } = parseDoorBanPolicies(policies);

    const studentsFromWildcard = positionIds.includes("*")
      ? authorizedPrismaClient.member
          .findMany({
            where: { classYear: { gte: new Date().getFullYear() - 10 } },
            select: { studentId: true },
          })
          .then((members) =>
            members
              .map((member) => member.studentId)
              .filter((id): id is string => id !== null),
          )
      : [];

    const positions = await fetchMatchingPositions(
      positionIds,
      authorizedPrismaClient,
    );

    const studentsFromPositions = await fetchStudentsWithPositions(
      positions.map((p) => p.id),
      authorizedPrismaClient,
    );

    // Fpr no we are only interested in the studentIds that are banned,
    // but we might want to use the positionIdsBanned in the future.
    const bannedStudents = new Set(studentIdsBanned);

    /** students with current access to the door who are not banned */
    const allowedStudents = [
      ...studentIds,
      ...studentsFromPositions,
      ...(await studentsFromWildcard),
    ].filter((studentId) => !bannedStudents.has(studentId));

    return new Response(
      Array.from([
        ...new Set([...allowedStudents, ...BACKUP_LIST_OF_STUDENT_IDS]),
      ]).join("\n"),
    );
  } catch {
    return new Response(BACKUP_LIST_OF_STUDENT_IDS.join("\n"));
  }
};
