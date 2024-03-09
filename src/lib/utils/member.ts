import type { PrismaClient } from "@prisma/client";
import { getDerivedRoles } from "./authorization";
import { error } from "@sveltejs/kit";

export const getCustomAuthorOptions = async (
  prisma: PrismaClient,
  memberId: string,
) => {
  const activePositionIds = await prisma.position
    .findMany({
      select: {
        id: true,
      },
      where: {
        mandates: {
          some: {
            startDate: {
              lte: new Date(),
            },
            endDate: {
              gte: new Date(),
            },
            memberId,
          },
        },
      },
    })
    .then((positions) => positions.map((pos) => pos.id));
  return await prisma.customAuthor.findMany({
    where: {
      roles: {
        some: {
          role: {
            in: getDerivedRoles(activePositionIds, !!memberId),
          },
        },
      },
    },
  });
};

export const getCurrentDoorPoliciesForMember = async (
  prisma: PrismaClient,
  memberId: string,
) => {
  const [memberResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        id: memberId,
      },
      include: {
        mandates: {
          where: {
            startDate: {
              lte: new Date(),
            },
            endDate: {
              gte: new Date(),
            },
          },
          include: {
            position: {},
          },
        },
        doorAccessPolicies: {},
      },
    }),
  ]);

  if (memberResult.status === "rejected") {
    throw error(500, "Could not fetch member");
  }
  if (!memberResult.value) {
    throw error(404, "Member not found");
  }

  const member = memberResult.value;
  const allDoorPolicies = await prisma.doorAccessPolicy.findMany();

  const roles = member.doorAccessPolicies.map((d) => d.role).filter(notEmpty);
  const positions = (
    await prisma.position.findMany({
      where: {
        id: {
          in: roles,
        },
      },
    })
  ).concat(member.mandates.map((m) => m.position));

  // Map a doorname to roles, startDate and endDate
  const allMemberDoors = new Map<
    string,
    {
      roles: string[];
      startDate: Date | null;
      endDate: Date | null;
    }
  >();

  allDoorPolicies
    .filter((doorPolicy) =>
      member.mandates.some(
        (mandate) =>
          // A doorpolicy is associated with either a role or a specific member
          (doorPolicy.role && mandate.positionId.startsWith(doorPolicy.role)) ||
          doorPolicy.studentId === member.studentId,
      ),
    )
    .forEach((doorPolicy) => {
      // Get a nice name for a position instead of using the id
      const positionNamesFromMandates = positions
        .filter(
          (position) =>
            doorPolicy.role && position.id.startsWith(doorPolicy.role),
        )
        .map((position) => position.name);
      const positionNames: string[] =
        positionNamesFromMandates.length > 0
          ? positionNamesFromMandates
          : ["Du"];

      const oldData = allMemberDoors.get(doorPolicy.doorName);
      const newData = oldData ?? {
        roles: [...positionNames],
        startDate: doorPolicy.startDatetime,
        endDate: doorPolicy.endDatetime,
      };
      if (oldData) {
        // Remove duplicates
        newData.roles = [...new Set(oldData.roles.concat(...positionNames))];

        if (doorPolicy.startDatetime) {
          newData.startDate =
            oldData.startDate === null ||
            doorPolicy.startDatetime > oldData.startDate
              ? oldData.startDate
              : doorPolicy.startDatetime;
        }
        if (doorPolicy.endDatetime) {
          newData.endDate =
            oldData.endDate === null || doorPolicy.endDatetime < oldData.endDate
              ? oldData.endDate
              : doorPolicy.endDatetime;
        }
      }
      allMemberDoors.set(doorPolicy.doorName, newData);
    });

  return allMemberDoors;
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
