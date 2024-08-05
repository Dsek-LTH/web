import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { uploadFile } from "$lib/files/uploadFiles";
import { createSchema, updateSchema } from "$lib/news/schema";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { redirect } from "$lib/utils/redirect";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import * as m from "$paraglide/messages";
import { Prisma } from "@prisma/client";
import type { Action } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";

const uploadImage = async (user: AuthUser, image: File, slug: string) => {
  const imageUrl = await uploadFile(
    user,
    image,
    `public/news/${slug}`,
    PUBLIC_BUCKETS_FILES,
    "header",
    {
      resize: {
        width: 1024,
      },
    },
  );
  return imageUrl;
};

export const createArticle: Action = async (event) => {
  const { request, locals } = event;
  const { prisma, user } = locals;
  const form = await superValidate(request, zod(createSchema), {
    allowFiles: true,
  });
  if (!form.valid) return fail(400, { form });
  const {
    author,
    tags,
    header,
    sendNotification: shouldSendNotification,
    notificationText,
    image,
    ...rest
  } = form.data;
  const existingAuthor = await prisma.author.findFirst({
    where: {
      member: { studentId: user?.studentId },
      mandateId: author.mandateId,
      customId: author.customId,
    },
  });
  let slug = slugify(header);
  const slugCount = await prisma.article.count({
    where: {
      slug: { startsWith: slug },
    },
  });
  slug = slugWithCount(slug, slugCount);

  if (image) rest.imageUrl = await uploadImage(user, image, slug);

  const result = await prisma.article.create({
    data: {
      slug,
      header: header,
      ...rest,
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
  if (shouldSendNotification)
    await sendNotification({
      title: header,
      message: notificationText ? notificationText : rest.body,
      type: NotificationType.NEW_ARTICLE,
      link: `/news/${result.slug}`,
      fromAuthor: result.author,
    });

  throw redirect(
    `/news/${result.slug}`,
    {
      message: m.news_articleCreated(),
      type: "success",
    },
    event,
  );
};
export const updateArticle: Action<{ slug: string }> = async (event) => {
  const { request, locals } = event;
  const { prisma, user } = locals;
  const form = await superValidate(request, zod(updateSchema), {
    allowFiles: true,
  });
  if (!form.valid) return fail(400, { form });
  const { slug, author, tags, image, ...rest } = form.data;
  const existingAuthor = await prisma.author.findFirst({
    where: {
      member: { id: author.memberId },
      mandateId: author.mandateId,
      customId: author.customId,
    },
  });

  if (image) rest.imageUrl = await uploadImage(user, image, slug);

  try {
    await prisma.article.update({
      where: {
        slug: slug,
      },
      data: {
        ...rest,
        author: {
          connect: existingAuthor
            ? {
                id: existingAuthor.id,
              }
            : undefined,
          create: existingAuthor
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
        tags: {
          set: tags.map(({ id }) => ({ id })),
        },
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return message(
        form,
        {
          message: m.news_errors_articleNotFound(),
          type: "error",
        },
        { status: 400 },
      );
    }
    throw e;
  }

  throw redirect(
    `/news/${event.params.slug}`,
    {
      message: m.news_articleUpdated(),
      type: "success",
    },
    event,
  );
};
