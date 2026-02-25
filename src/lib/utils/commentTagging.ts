import type {
	ExtendedPrisma,
	ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";
import { tagRegex } from "$lib/utils/client/commentTagging";

export const getAllTaggedMembers = async (
	prisma: ExtendedPrisma,
	comments: Array<
		ExtendedPrismaModel<"ArticleComment"> | ExtendedPrismaModel<"EventComment">
	>,
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
