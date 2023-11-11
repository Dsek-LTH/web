import { ctxAccessGuard, hasAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { tagRegex } from "$lib/utils/commentTagging";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import { getArticle } from "../articles";
import { modifyLikes } from "../likes";
import type { PageServerLoad } from "./$types";
import { Prisma } from "@prisma/client";

export const load: PageServerLoad = async ({ params, parent }) => {
  const article = await getArticle(params.slug);
  const allTaggedMembers = await prisma.member.findMany({
    where: {
      studentId: {
        in: [
          ...new Set(
            article?.comments.flatMap(
              (comment) =>
                [...(comment.content ?? "").matchAll(tagRegex)]
                  .map((match) => match[2])
                  .filter((taggedMember) => taggedMember) as string[]
            )
          ),
        ],
      },
    },
  });
  if (article == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const { session } = await parent();
  const canEdit = await hasAccess([apiNames.NEWS.UPDATE, apiNames.NEWS.MANAGE], session?.user, {
    studentId: article.author.member.studentId,
  });
  return {
    article,
    allTaggedMembers,
    canEdit,
  };
};

export const actions = {
  like: async (props) => {
    return modifyLikes(props, true);
  },
  dislike: async (props) => {
    return modifyLikes(props, false);
  },
  comment: async ({ locals, request, params }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.NEWS.COMMENT, session?.user);
    if (!session?.user?.student_id) {
      return fail(401, { error: "Not logged in" });
    }
    const formData = await request.formData();
    const content = formData.get("content");
    if (!content || typeof content !== "string") {
      return fail(400, { error: "No content provided", data: { content } });
    }
    try {
      await prisma.article.update({
        where: { slug: params.slug },
        data: {
          comments: {
            create: {
              member: {
                connect: {
                  studentId: session.user.student_id,
                },
              },
              content,
              published: new Date(),
            },
          },
        },
        select: {
          id: true,
        },
      });
      return { success: true, data: { content: undefined as undefined | string } };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Article not found", data: { content } });
        }
        return fail(500, {
          error: e.message ?? e.meta?.details ?? "Unknown error",
          data: { content },
        });
      }
    }
  },
};
