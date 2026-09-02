import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { tagRegex } from "$lib/utils/client/commentTagging";

// Deliberately just `content`, not the full Prisma comment models: this is
// the only field read below, and article comments now come from the Go API
// ($lib/api/client), which doesn't return the full Prisma shape.
export const getAllTaggedMembers = async (
  prisma: ExtendedPrisma,
  comments: Array<{ content: string | null }>,
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
