import type { PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";
import { getDerivedRoles } from "./authorization";

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

export type MemberDoorPolicies = {
  name: string;
  roles: string[];
  startDate: Date | null;
  endDate: Date | null;
}[];

export const getCurrentDoorPoliciesForMember = async (
  prisma: PrismaClient,
  studentId: string,
) => {
  const memberPositionIds = await prisma.position
    .findMany({
      select: {
        id: true,
        name: true,
        boardMember: true,
      },
      where: {
        mandates: {
          some: {
            member: {
              studentId,
            },
            startDate: {
              lte: new Date(),
            },
            endDate: {
              gte: new Date(),
            },
          },
        },
      },
    })
    .catch(() => {
      throw error(500, "Could not fetch member positions");
    });
  const userDoorPolicies = await prisma.doorAccessPolicy
    .findMany({
      where: {
        AND: [
          {
            // is active, or indefinite
            OR: [
              {
                startDatetime: null,
              },
              {
                startDatetime: {
                  lte: new Date(),
                },
              },
            ],
          },
          {
            // is active, or indefinite
            OR: [
              {
                endDatetime: null,
              },
              {
                endDatetime: {
                  gte: new Date(),
                },
              },
            ],
          },
          {
            OR: [
              {
                studentId, // is for this user
              },
              {
                role: {
                  in: getDerivedRoles(
                    memberPositionIds.map((pos) => pos.id),
                    true,
                  ).concat(
                    memberPositionIds.some((pos) => pos.boardMember)
                      ? ["dsek.styr"]
                      : [],
                  ),
                },
              },
            ],
          },
        ],
      },
    })
    .catch(() => {
      throw error(500, "Could not fetch door access");
    });

  const policiesByDoor: MemberDoorPolicies = userDoorPolicies.reduce(
    (acc, policy) => {
      const role = policy.role ?? "Du";
      const duplicate = acc.find(
        (p) =>
          p.name === policy.doorName &&
          p.startDate === policy.startDatetime &&
          p.endDate === policy.endDatetime,
      );
      if (duplicate) {
        duplicate.roles.push(role);
        return acc;
      }
      acc.push({
        name: policy.doorName,
        roles: [role],
        startDate: policy.startDatetime,
        endDate: policy.endDatetime,
      });
      return acc;
    },
    [] as MemberDoorPolicies,
  );
  const memberDoorPolicies: MemberDoorPolicies = policiesByDoor.map(
    (policy) => {
      const positionsMappedToThisDoor = memberPositionIds
        .filter((pos) =>
          policy.roles.some(
            (role) =>
              pos.id.startsWith(role) ||
              (pos.boardMember && role === "dsek.styr"),
          ),
        )
        .map((pos) => pos.name);
      positionsMappedToThisDoor.sort();
      return {
        ...policy,
        roles:
          positionsMappedToThisDoor.length > 0
            ? positionsMappedToThisDoor
            : ["Du"],
      };
    },
  );
  memberDoorPolicies.sort((a, b) => a.name.localeCompare(b.name));

  return memberDoorPolicies;
};
