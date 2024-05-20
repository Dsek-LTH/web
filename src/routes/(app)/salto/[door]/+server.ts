import type { RequestHandler } from "./$types";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";

export const GET: RequestHandler = async ({ locals, params }) => {
  const { prisma } = locals;
  const now = new Date().toISOString();
  const policies = await prisma.doorAccessPolicy.findMany({
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

  const studentIds = policies
    .map((policy) => policy.studentId)
    .filter((id): id is string => id !== null);
  const positionIds = policies
    .map((policy) => policy.role)
    .filter((id): id is string => id !== null);

  // Find
  const positions = await prisma.position.findMany({
    where: {
      OR: positionIds.map((p) => ({
        id: {
          startsWith: `${p}%`,
        },
      })),
    },
  });

  // Take positions such as "dsek" and "dsek.km" and return all students with these roles
  const studentsFromRoles = (
    await prisma.mandate.findMany({
      where: {
        positionId: {
          in: positions.map((p) => p.id),
        },
      },
      select: {
        member: {
          select: {
            studentId: true,
          },
        },
      },
    })
  )
    .map((mandate) => mandate.member.studentId)
    .filter((id): id is string => id !== null);

  return new Response(
    Array.from([
      ...new Set([
        ...BACKUP_LIST_OF_STUDENT_IDS,
        ...studentIds,
        ...studentsFromRoles,
      ]),
    ]).join("\n"),
  );
};
