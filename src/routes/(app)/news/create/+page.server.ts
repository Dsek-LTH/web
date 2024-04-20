import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/client";
import { getArticleAuthorOptions } from "../articles";
import { articleSchema } from "../schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.NEWS.CREATE, user);

  const allTags = await prisma.tag.findMany();
  const currentMemberWithMandates = await prisma.member.findUnique({
    where: {
      studentId: user?.studentId,
    },
    include: {
      mandates: {
        where: {
          startDate: {
            lte: new Date(),
          },
          endDate: {
            gte: new Date(),
          },
        },
        include: {
          position: true,
        },
      },
    },
  });
  if (!currentMemberWithMandates) throw error(500, "Member not found");
  const authorOptions = await getArticleAuthorOptions(
    prisma,
    currentMemberWithMandates,
  );
  return {
    allTags,
    authorOptions,
    form: await superValidate(
      {
        author: authorOptions[0],
      },
      articleSchema,
    ),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const form = await superValidate(request, articleSchema);
    if (!form.valid) return fail(400, { form });
    const { header, body, author, tags } = form.data;
    const existingAuthor = await prisma.author.findFirst({
      where: {
        member: { studentId: user?.studentId },
        mandateId: author.mandateId,
        customId: author.customId,
      },
    });
    const slug = slugify(header);
    const slugCount = await prisma.article.count({
      where: {
        slug: { startsWith: slug },
      },
    });
    const result = await prisma.article.create({
      data: {
        slug: slugWithCount(slug, slugCount),
        header: header,
        body: body,
        author: {
          connect: existingAuthor
            ? {
                id: existingAuthor.id,
              }
            : undefined,
          create: !existingAuthor
            ? {
                member: {
                  connect: { studentId: user?.studentId },
                },
                mandate: author.mandateId
                  ? {
                      connect: {
                        member: { studentId: user?.studentId },
                        id: author.mandateId,
                      },
                    }
                  : undefined,
                customAuthor: author.customId
                  ? {
                      connect: { id: author.customId },
                    }
                  : undefined,
              }
            : undefined,
        },
        // imageUrl: (image as string | undefined) || null,
        tags: {
          connect: tags
            .filter((tag) => !!tag)
            .map((tag) => ({
              id: tag.id,
            })),
        },
        publishedAt: new Date(),
      },
      include: {
        author: true,
      },
    });

    // fetch the created author,

    await sendNotification({
      title: header,
      message: body,
      type: NotificationType.NEW_ARTICLE,
      link: `/news/${result.slug}`,
      fromAuthor: result.author,
    });

    throw redirect(
      `/news/${result.slug}`,
      {
        message: "Nyhet skapad",
        type: "success",
      },
      event,
    );
  },
};
