import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { fail, type RequestEvent } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const likeSchema = z.object({
  articleId: z.string(),
});
export type LikeSchema = Infer<typeof likeSchema>;

export const likesAction =
  (shouldLike: boolean) =>
  async ({ request, locals }: RequestEvent<Record<string, string>, string>) => {
    const { prisma, user, member } = locals;
    const form = await superValidate(request, zod(likeSchema));
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
      await sendNotification({
        title: `${article.header}`,
        message: `${getFullName(member)} har gillat din nyhet`,
        type: NotificationType.NEWS_LIKE,
        link: `/news/${article.slug}`,
        memberIds: [article.author.memberId],
        fromMemberId: member.id,
      });
    }
    return message(form, {
      message: shouldLike
        ? m.news_likedArticle()
        : m.news_stoppedLikingArticle(),
      type: "hidden",
    });
  };
