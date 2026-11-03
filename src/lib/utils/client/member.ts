// TEMPORARY dual-shape type, not a design goal: all optional so this
// accepts both Prisma's Member (`firstName: string | null`) and the Go
// API's Member (`firstName?: string`) - see backend/CLAUDE.md. This is a
// pure type-level widening (no conversion function/logic), kept only
// because MemberAvatar/getFullName/getInitials have ~20 consumers and only
// one (AuthorCard) is Go-backed today. Narrow this back to the Go-only
// shape (drop `| null`) once the rest of those consumers - bookings,
// notifications, navbar, committees, board, member profile, etc.
// - are ported off Prisma; don't let this linger past that point.
export type MemberNames = {
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
};
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
