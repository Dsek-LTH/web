import type { DoorAccessPolicy, PrismaClient } from "@prisma/client";
import type { RequestHandler } from "./$types";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";

/**
 * Every door policy applies to either a studentId or a positionId.
 * This function splits the policies into two respective arrays.
 */
function parseDoorPolicies(policies: DoorAccessPolicy[]) {
  const studentIds = policies
    .map((policy) => policy.studentId)
    .filter((id): id is string => id !== null);
  const positionIds = policies
    .map((policy) => policy.role)
    .filter((id): id is string => id !== null);
  return { studentIds, positionIds };
}

/**
 * Given an array of role strings such as "dsek", "dsek.km", etc,
 * return an array of positions that match the input strings.
 */
function fetchMatchingPositions(positions: string[], prisma: PrismaClient) {
  return prisma.position.findMany({
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
  const now = new Date().toISOString();
  const policies = await authorizedPrismaClient.doorAccessPolicy.findMany({
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
  const positions = await fetchMatchingPositions(
    positionIds,
    authorizedPrismaClient,
  );
  const studentsFromPositions = await fetchStudentsWithPositions(
    positions.map((p) => p.id),
    authorizedPrismaClient,
  );

  return new Response(
    Array.from([
      ...new Set([
        ...BACKUP_LIST_OF_STUDENT_IDS,
        ...studentIds,
        ...studentsFromPositions,
      ]),
    ]).join("\n"),
  );
};
