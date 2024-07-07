import type { Member } from "@prisma/client";
export type MemberNames = Pick<Member, "firstName" | "nickname" | "lastName">;
export const getFullName = (member: MemberNames) => {
  if (member.nickname) {
    if (member.firstName && member.lastName)
      return `${member.firstName} "${member.nickname}" ${member.lastName}`;
    return `"${member.nickname}"`;
  }
  if (member.firstName && member.lastName)
    return `${member.firstName} ${member.lastName}`;
  return member.firstName || member.lastName || "No name";
};
