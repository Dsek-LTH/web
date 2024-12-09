import type { Member } from "@prisma/client";
export type MemberNames = Pick<Member, "firstName" | "nickname" | "lastName">;
type Options = {
  hideNickname?: boolean;
};
export const getFullName = (member: MemberNames, options: Options = {}) => {
  const truncatedNickname =
    member.nickname && member.nickname.length > 60
      ? member.nickname.substring(0, 57) + "..."
      : member.nickname;

  if (truncatedNickname && !options.hideNickname) {
    if (member.firstName && member.lastName)
      return `${member.firstName} "${truncatedNickname}" ${member.lastName}`;
    return `"${truncatedNickname}"`;
  }
  if (member.firstName && member.lastName)
    return `${member.firstName} ${member.lastName}`;
  return member.firstName || member.lastName || "No name";
};
