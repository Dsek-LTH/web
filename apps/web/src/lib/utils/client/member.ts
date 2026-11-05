import type { components } from "$lib/api/schema";

export type MemberNames = Pick<
  components["schemas"]["Member"],
  "firstName" | "lastName" | "nickname"
>;
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

export const getInitials = (member?: MemberNames) => {
  if (member && member.firstName && member.lastName)
    return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`;
  return "NN";
};
