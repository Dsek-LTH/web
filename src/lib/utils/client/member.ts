import type { Member } from "@prisma/client";
export type MemberNames = Pick<Member, "firstName" | "nickname" | "lastName">;
export const getFullName = (member: MemberNames) => {
  if (member.nickname)
    return `${member.firstName} "${member.nickname}" ${member.lastName}`;
  if (member.firstName && member.lastName)
    return `${member.firstName} ${member.lastName}`;
  return member.firstName || member.lastName || "No name";
};
