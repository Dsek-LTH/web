import { env } from "$env/dynamic/private";
import { sendNewArticleNotification } from "$lib/news/server/notifications";
import { sendNewArticleWebhook } from "$lib/news/server/webhooks";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  const body: ExtendedPrismaModel<"Article"> & {
    tags: Array<Pick<ExtendedPrismaModel<"Tag">, "id">>;
    author: ExtendedPrismaModel<"Author">;
    password: string;
    notificationText: string;
  } = await request.json();

  const { password, notificationText } = body;
  if (!password || password !== env.SCHEDULER_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }

  await Promise.allSettled([
    await sendNewArticleNotification(body, notificationText),
    await sendNewArticleWebhook(body, notificationText),
  ]);

  return new Response("Article created", { status: 201 });
};
