import type {
  Author,
  CustomAuthor,
  Mandate,
  Member,
  Position,
} from "@prisma/client";
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

export const getAuthorName = (
  author: Author & {
    member: Member;
    mandate:
      | (Mandate & {
          position: Position;
        })
      | null;
    customAuthor: CustomAuthor | null;
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
