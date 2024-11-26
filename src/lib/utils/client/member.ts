import type { Member } from "@prisma/client";
export type MemberNames = Pick<Member, "firstName" | "nickname" | "lastName">;
type Options = {
  hideNickname?: boolean;
};
export const getFullName = (member: MemberNames, options: Options = {}) => {
  if (member.nickname && !options.hideNickname) {
    if (member.firstName && member.lastName)
      return `${member.firstName} "${member.nickname}" ${member.lastName}`;
    return `"${member.nickname}"`;
  }
  if (member.firstName && member.lastName)
    return `${member.firstName} ${member.lastName}`;
  return member.firstName || member.lastName || "No name";
};
