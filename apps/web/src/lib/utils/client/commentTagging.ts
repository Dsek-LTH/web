import { getFullName, type MemberNames } from "$lib/utils/client/member";

export const tagRegex = /\[([^\]]*)\]\(\/members\/([^)]+)\)/g;

export type TaggedMember = MemberNames & { studentId?: string | null };

/**
 * Replaces the stored member-tag markdown with the member's current name.
 * The name in the stored markdown may be outdated if the member has changed
 * their name since the comment was written.
 */
export const replaceCommentTags = (
  content: string,
  taggedMembers: TaggedMember[],
) =>
  content.replace(tagRegex, (_, fallbackName: string, studentId: string) => {
    const member = taggedMembers.find(
      (taggedMember) => taggedMember.studentId === studentId,
    );
    const name = member ? `@${getFullName(member)}` : fallbackName;
    return `[${name || "@Unknown User"}](/members/${studentId})`;
  });

export const getMentionText = (member: TaggedMember) =>
  `[@${getFullName(member)}](/members/${member.studentId}) `;
