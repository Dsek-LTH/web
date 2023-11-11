import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";
import { fail, type RequestEvent } from "@sveltejs/kit";

export const modifyLikes = async (
  { request, locals }: RequestEvent<Record<string, string>, string>,
  shouldLike: boolean
) => {
  const session = await locals.getSession();
  if (!session?.user?.student_id) {
    return fail(401, { error: "Not logged in" });
  }
  await ctxAccessGuard(apiNames.NEWS.LIKE, session?.user);
  const formData = await request.formData();
  const articleId = formData.get("articleId");
  if (!articleId) {
    return fail(400, { error: "No article ID provided" });
  }
  const likers: Prisma.MemberUpdateManyWithoutLikedArticlesNestedInput = shouldLike
    ? {
        connect: {
          studentId: session.user.student_id,
        },
      }
    : {
        disconnect: {
          studentId: session.user.student_id,
        },
      };
  try {
    await prisma.article.update({
      where: { id: String(articleId) },
      data: {
        likers,
      },
      select: {
        id: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025" || e.code === "2016") {
        return fail(404, { error: "Article not found" });
      }
      return fail(500, { error: e.message ?? e.meta?.details ?? "Unknown error" });
    }
  }
  return { status: 200 };
};
