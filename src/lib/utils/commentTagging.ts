import { tagRegex } from "$lib/utils/client/commentTagging";
import type {
  ArticleComment,
  EventComment,
  PrismaClient,
} from "@prisma/client";

export const getAllTaggedMembers = async (
  prisma: PrismaClient,
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
