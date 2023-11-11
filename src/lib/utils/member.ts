import type { Member } from "@prisma/client";
import { error } from "@sveltejs/kit";
import { getRoleSet, type Context } from "./access";
import prisma from "./prisma";

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

export const getFullName = (member: Pick<Member, "nickname" | "firstName" | "lastName">) => {
  if (member.nickname) return `${member.firstName} "${member.nickname}" ${member.lastName}`;
  return `${member.firstName} ${member.lastName}`;
};
