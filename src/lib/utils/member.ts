import { error } from "@sveltejs/kit";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";
import { getDerivedRoles } from "./authorization";

export const getCurrentMember = async (
  prisma: PrismaClient,
  user?: AuthUser,
) => {
  if (!user?.studentId) {
    throw error(401, "Not logged in");
  }
  const member = await prisma.member.findUnique({
    where: {
      studentId: user?.studentId,
    },
  });
  if (!member) {
    throw error(401, "Member not found");
  }
  return member;
};

export const getCurrentMemberId = async (
  prisma: PrismaClient,
  user?: AuthUser,
) => {
  const member = await getCurrentMember(prisma, user);
  return member.id;
};

export const getMyCustomAuthorOptions = async (
  prisma: PrismaClient,
  user?: AuthUser,
) => {
  return await getCustomAuthorOptions(
    prisma,
    await getCurrentMemberId(prisma, user),
  );
};

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
            in: getDerivedRoles(activePositionIds),
          },
        },
      },
    },
  });
};
