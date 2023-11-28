import type { Context } from "$lib/utils/access";
import type { Member } from "@prisma/client";

export const getFullName = (
  context: Context,
  member: Pick<Member, "nickname" | "firstName" | "lastName">
) => {
  if (member.nickname && context?.student_id)
    return `${member.firstName} "${member.nickname}" ${member.lastName}`;
  return `${member.firstName} ${member.lastName}`;
};

export const getAuthorizedFullName = (
  member: Pick<Member, "nickname" | "firstName" | "lastName">
) => {
  if (member.nickname) return `${member.firstName} "${member.nickname}" ${member.lastName}`;
  return `${member.firstName} ${member.lastName}`;
};
