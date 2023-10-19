import { error } from "@sveltejs/kit";
import type { Context } from "./access";
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
