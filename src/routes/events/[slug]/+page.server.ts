import { getEvent } from "../events";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { ctxAccessGuard, hasAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { getAllTaggedMembers } from "$lib/utils/commentTagging";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";

export const load: PageServerLoad = async ({ params, parent }) => {
  const event = await getEvent(params.slug);
  if (event == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const allTaggedMembers = await getAllTaggedMembers(event.comments);
  const { session } = await parent();
  const canEdit = await hasAccess(apiNames.EVENT.UPDATE, session?.user, {
    studentId: event.author.studentId,
  });
  return {
    event,
    allTaggedMembers,
    canEdit,
  };
};

export const actions = {
  comment: async ({ locals, request, params }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.EVENT.COMMENT, session?.user);
    if (!session?.user?.student_id) {
      return fail(401, { error: "Not logged in" });
    }
    const formData = await request.formData();
    const content = formData.get("content");
    if (!content || typeof content !== "string") {
      return fail(400, { error: "No content provided", data: { content } });
    }
    try {
      await prisma.event.update({
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
          return fail(404, { error: "Event not found", data: { content } });
        }
        return fail(500, {
          error: e.message ?? e.meta?.details ?? "Unknown error",
          data: { content },
        });
      }
      return fail(500, { error: "Unknown error", data: { content } });
    }
  },
  removeComment: async ({ locals, params, request }) => {
    const session = await locals.getSession();
    await ctxAccessGuard(apiNames.EVENT.COMMENT_DELETE, session?.user);
    if (!session?.user?.student_id) {
      return fail(401, { error: "Not logged in" });
    }
    const formData = await request.formData();
    const commentId = formData.get("commentId");
    if (!commentId || typeof commentId !== "string") {
      return fail(400, { error: "No commentId provided" });
    }
    try {
      await prisma.event.update({
        where: { slug: params.slug },
        data: {
          comments: {
            delete: {
              id: commentId,
            },
          },
        },
      });
      return { success: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Event not found" });
        }
        return fail(500, {
          error: e.message ?? e.meta?.details ?? "Unknown error",
        });
      }
      return fail(500, { error: "Unknown error" });
    }
  },
};
