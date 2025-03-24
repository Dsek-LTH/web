import type { Author, CustomAuthor, Member, Position } from "@prisma/client";
export type MemberNames = Pick<Member, "firstName" | "lastName"> &
  Partial<Pick<Member, "nickname">>;
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

export const getAuthorName = (
  author: Pick<Author, "type"> & {
    member: Pick<Member, "firstName" | "nickname" | "lastName" | "picturePath">;
    mandate: {
      position: Pick<Position, "name">;
    } | null;
    customAuthor: Pick<CustomAuthor, "name"> | null;
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
