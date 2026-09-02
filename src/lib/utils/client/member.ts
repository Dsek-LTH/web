import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

// TEMPORARY dual-shape type, not a design goal: all optional so this
// accepts both Prisma's Member (`firstName: string | null`) and the Go
// API's Member (`firstName?: string`) - see backend/CLAUDE.md. This is a
// pure type-level widening (no conversion function/logic), kept only
// because MemberAvatar/getFullName/getInitials have ~20 consumers and only
// one (AuthorCard) is Go-backed today. Narrow this back to the Go-only
// shape (drop `| null`) once the rest of those consumers - bookings,
// expenses, notifications, navbar, committees, board, member profile, etc.
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

export const getAuthorName = (
  author: Pick<ExtendedPrismaModel<"Author">, "type"> & {
    member: Pick<
      ExtendedPrismaModel<"Member">,
      "firstName" | "nickname" | "lastName" | "picturePath"
    >;
    mandate: {
      position: Pick<ExtendedPrismaModel<"Position">, "name">;
    } | null;
    customAuthor: Pick<ExtendedPrismaModel<"CustomAuthor">, "name"> | null;
  },
) => {
  if (author.type === "Custom") {
    if (!author.customAuthor)
      throw new Error("CustomAuthor missing in author object of type 'Custom'");
    return author.customAuthor.name;
  }
  if (author.type === "Mandate") {
    if (!author.mandate?.position)
      throw new Error(
        "Mandate and/or Position missing in author object of type 'Mandate'",
      );
    return `${author.mandate!.position.name} ${getFullName(author.member)}`;
  }
  if (author.type === "Member") return getFullName(author.member);
  throw new Error(`Unknown author type: ${author.type}`);
};
