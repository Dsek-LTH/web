import { tagRegex } from "$lib/utils/client/commentTagging";
import prisma from "$lib/utils/prisma";
import type { ArticleComment, EventComment } from "@prisma/client";

export const getAllTaggedMembers = async (
  comments: (ArticleComment | EventComment)[],
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
