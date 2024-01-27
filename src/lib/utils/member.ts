import { error } from "@sveltejs/kit";
import { getRoleSet, type Context } from "./access";
import type { PrismaClient } from "@prisma/client";

export const getCurrentMember = async (
  prisma: PrismaClient,
  context: Context,
) => {
  if (!context?.student_id) {
    throw error(401, "Not logged in");
  }
  const member = await prisma.member.findUnique({
    where: {
      studentId: context?.student_id,
    },
  });
  if (!member) {
    throw error(401, "Member not found");
  }
  return member;
};

export const getCurrentMemberId = async (
  prisma: PrismaClient,
  context: Context,
) => {
  const member = await getCurrentMember(prisma, context);
  return member.id;
};

export const getMyCustomAuthorOptions = async (
  prisma: PrismaClient,
  context: Context,
) => {
  return await getCustomAuthorOptions(
    prisma,
    await getCurrentMemberId(prisma, context),
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
            in: [...getRoleSet([...activePositionIds, "_"])],
          },
        },
      },
    },
  });
};
