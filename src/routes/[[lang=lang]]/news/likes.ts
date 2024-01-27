import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { getAuthorizedFullName } from "$lib/utils/client/member";
import { getCurrentMember } from "$lib/utils/member";
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
    const { prisma } = locals;
    const form = await superValidate(request, likeSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    const currentMember = await getCurrentMember(prisma, session?.user);
    return withAccess(
      apiNames.NEWS.LIKE,
      session?.user,
      async () => {
        const article = await prisma.article.update({
          where: { id: form.data.articleId },
          data: {
            likers: {
              [shouldLike ? "connect" : "disconnect"]: {
                studentId: session?.user?.student_id,
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
        await sendNotification(prisma, {
          title: `${article.header}`,
          message: `${getAuthorizedFullName(
            currentMember,
          )} har gillat din nyhet`,
          type: NotificationType.LIKE,
          link: `/news/${article.slug}`,
          memberIds: [article.author.memberId],
          fromMemberId: currentMember.id,
        });
        return message(form, {
          message: `${shouldLike ? "Gillat" : "Slutat gilla"} artikel`,
          type: "hidden",
        });
      },
      form,
    );
  };
