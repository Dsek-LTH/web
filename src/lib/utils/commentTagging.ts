import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { tagRegex } from "$lib/utils/client/commentTagging";
import type {
  ArticleComment,
  EventComment,
} from "@prisma/client";

export const getAllTaggedMembers = async (
  prisma: ExtendedPrisma,
  comments: Array<ArticleComment | EventComment>,
) => {
  return await prisma.member.findMany({
    where: {
      studentId: {
        in: [
          ...new Set(
            comments.flatMap(
              (comment) =>
                [...(comment.content ?? "").matchAll(tagRegex)]
                  .map((match) => match[2])
                  .filter((taggedMember) => taggedMember) as string[],
            ),
          ),
        ],
      },
    },
  });
};
