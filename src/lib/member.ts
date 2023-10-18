import { getRoleSet, type Context } from "$lib/access";
import prisma from "$lib/prisma";
import { error } from "@sveltejs/kit";

export const getCurrentMember = async (context: Context) => {
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

export const getCurrentMemberId = async (context: Context) => {
  const member = await getCurrentMember(context);
  return member.id;
};

export const getMyCustomAuthorOptions = async (context: Context) => {
  return await getCustomAuthorOptions(await getCurrentMemberId(context));
};

export const getCustomAuthorOptions = async (memberId: string) => {
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
