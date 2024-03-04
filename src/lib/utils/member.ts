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
  const allDoorPolicies = await prisma.doorAccessPolicy.findMany({});

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
          (doorPolicy.role !== null &&
            mandate.positionId.startsWith(doorPolicy.role)) ||
          doorPolicy.studentId === member.studentId,
      ),
    )
    .forEach((doorPolicy) => {
      // Get a nice name for a position instead of using the id
      const positionNames =
        positions
          .filter(
            (position) =>
              doorPolicy.role && position.id.startsWith(doorPolicy.role),
          )
          .map((position) => position.name) ??
        doorPolicy.role ??
        "Du";

      const old = allMemberDoors.get(doorPolicy.doorName);
      const newDoor = old ?? {
        roles: [...positionNames],
        startDate: doorPolicy.startDatetime,
        endDate: doorPolicy.endDatetime,
      };
      if (old) {
        newDoor.roles = old.roles.concat(...positionNames);

        if (doorPolicy.startDatetime) {
          newDoor.startDate =
            old.startDate === null || doorPolicy.startDatetime > old.startDate
              ? old.startDate
              : doorPolicy.startDatetime;
        }
        if (doorPolicy.endDatetime) {
          newDoor.endDate =
            old.endDate === null || doorPolicy.endDatetime < old.endDate
              ? old.endDate
              : doorPolicy.endDatetime;
        }
      }
      newDoor.roles = [...new Set(newDoor.roles)]; // remove duplicates
      allMemberDoors.set(doorPolicy.doorName, newDoor);
    });

  return allMemberDoors;
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
