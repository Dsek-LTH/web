import type { Member } from "@prisma/client";

export const getFullName = (
  member: Pick<Member, "firstName" | "nickname" | "lastName">,
) => {
  if (member.nickname)
    return `${member.firstName} "${member.nickname}" ${member.lastName}`;
  return `${member.firstName} ${member.lastName}`;
};
