import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { fail, type RequestEvent } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const likeSchema = z.object({
  articleId: z.string(),
});
export type LikeSchema = typeof likeSchema;

export const likesAction =
  (shouldLike: boolean) =>
  async ({ request, locals }: RequestEvent<Record<string, string>, string>) => {
    const { prisma, user, member } = locals;
    const form = await superValidate(request, likeSchema);
    if (!form.valid) return fail(400, { form });

    const article = await prisma.article.update({
      where: { id: form.data.articleId },
      data: {
        likers: {
          [shouldLike ? "connect" : "disconnect"]: {
            studentId: user?.studentId,
          },
        },
      },
      select: {
        slug: true,
        header: true,
        author: {
          select: {
            memberId: true,
          },
        },
      },
    });
    if (member && shouldLike) {
      await sendNotification(prisma, {
        title: `${article.header}`,
        message: `${getFullName(member)} har gillat din nyhet`,
        type: NotificationType.LIKE,
        link: `/news/${article.slug}`,
        memberIds: [article.author.memberId],
        fromMemberId: member.id,
      });
    }
    return message(form, {
      message: `${shouldLike ? "Gillat" : "Slutat gilla"} artikel`,
      type: "hidden",
    });
  };
