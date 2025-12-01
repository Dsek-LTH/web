import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { uploadFile } from "$lib/files/uploadFiles";
import { createSchema, updateSchema } from "$lib/news/schema";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { redirect } from "$lib/utils/redirect";
import { slugWithCount, slugify } from "$lib/utils/slugify";
import * as m from "$paraglide/messages";
import { Prisma } from "@prisma/client";
import type { Action } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate, fail } from "sveltekit-superforms";
import DOMPurify from "isomorphic-dompurify";
import { env } from "$env/dynamic/private";
import { env as envPublic } from "$env/dynamic/public";
import { sendNewArticleNotification } from "./notifications";
import { getDecryptedJWT } from "$lib/server/getDecryptedJWT";

const uploadImage = async (user: AuthUser, image: File, slug: string) => {
  const randomName = (Math.random() + 1).toString(36).substring(2);
  const imageUrl = await uploadFile(
    user,
    image,
    `public/news/${slug}`,
    PUBLIC_BUCKETS_FILES,
    randomName,
    {
      resize: {
        width: 1920,
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
    headerSv,
    headerEn,
    sendNotification: shouldSendNotification,
    notificationText,
    images,
    bodySv,
    bodyEn,
    publishTime,
    ...rest
  } = form.data;
  const existingAuthor = await prisma.author.findFirst({
    where: {
      member: { studentId: user?.studentId },
      mandateId: author.mandateId,
      customId: author.customId,
    },
  });
  let slug = slugify(headerSv);
  // authorized so we actually count all
  const slugCount = await authorizedPrismaClient.article.count({
    where: {
      slug: { startsWith: slug },
    },
  });
  slug = slugWithCount(slug, slugCount);
  const tasks: Array<Promise<string>> = [];
  Array.from(images).forEach((image) => {
    tasks.push(uploadImage(user, image, slug));
  });
  await Promise.resolve();
  rest.imageUrls = await Promise.all(tasks);

  const data = {
    slug,
    headerSv: headerSv,
    headerEn: headerEn,
    bodySv: DOMPurify.sanitize(bodySv),
    bodyEn: bodyEn ? DOMPurify.sanitize(bodyEn) : bodyEn,
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
    tags: {
      connect: tags
        .filter((tag) => !!tag)
        .map((tag) => ({
          id: tag.id,
        })),
    },
    publishedAt: publishTime ?? new Date(),
  };

  if (publishTime && publishTime > new Date()) {
    const jwt = await getDecryptedJWT(request);
    let result;
    try {
      result = await fetch(env.SCHEDULER_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          body: JSON.stringify(data),
          endpointURL: `${envPublic.PUBLIC_APP_URL}/api/schedule/news`,
          runTimestamp: publishTime,
          password: env.SCHEDULER_PASSWORD,
          token: jwt?.["id_token"],
        }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return fail(500, {
        form,
        message: `${m.news_errors_schedulingFailed()}: ${error}`,
      });
    }

    if (!result.ok) {
      return fail(500, {
        form,
        message: m.news_errors_schedulingFailed(),
      });
    }

    throw redirect(
      "/news",
      {
        message: m.news_articleScheduled(),
        type: "success",
      },
      event,
    );
  }

  const result = await prisma.article.create({
    data,
    include: {
      author: true,
    },
  });

  // fetch the created author,
  if (shouldSendNotification) {
    console.log("send notifications");
    await sendNewArticleNotification(
      {
        ...result,
        tags,
      },
      notificationText,
    );
  }

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
  const { slug, author, tags, images, bodySv, bodyEn, ...rest } = form.data;
  const existingAuthor = await prisma.author.findFirst({
    where: {
      member: { id: author.memberId },
      mandateId: author.mandateId,
      customId: author.customId,
    },
  });

  const tasks: Array<Promise<string>> = [];
  Array.from(images).forEach((image) => {
    tasks.push(uploadImage(user, image, slug));
  });

  await Promise.resolve();
  const newImages = await Promise.all(tasks);
  rest.imageUrls =
    rest.imageUrls === undefined
      ? newImages
      : [...rest.imageUrls, ...newImages];

  try {
    await prisma.article.update({
      where: {
        slug: slug,
      },
      data: {
        bodySv: DOMPurify.sanitize(bodySv),
        bodyEn: bodyEn ? DOMPurify.sanitize(bodyEn) : bodyEn,
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
