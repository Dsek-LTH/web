import { env } from "$env/dynamic/private";
import { sendNewArticleNotification } from "$lib/news/server/notifications";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const {
    password,
    sendNotification: shouldSendNotification,
    ...newsItem
  } = body;
  if (!password || password !== env.SCHEDULER_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { prisma } = locals;
  const result = await prisma.article.create({
    data: newsItem,
    include: { author: true },
  });

  if (shouldSendNotification) {
    console.log("send notifications");
    await sendNewArticleNotification(
      {
        ...result,
        tags: newsItem.tags,
      },
      newsItem.notificationText,
    );
  }

  return new Response("Article created", { status: 201 });
};
