import { env } from "$env/dynamic/private";
import { announceArticle } from "$lib/news/server/notifications";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  const secret = request.headers.get("X-Scheduler-Secret");
  if (!secret || secret !== env.SCHEDULER_PASSWORD) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body: ExtendedPrismaModel<"Article"> & {
    tags: Array<Pick<ExtendedPrismaModel<"Tag">, "id">>;
    author: ExtendedPrismaModel<"Author">;
    notificationText: string;
  } = await request.json();

  const { notificationText } = body;

  // The payload is a snapshot from when the article was scheduled, and deleting it
  // doesn't cancel this task, so check that it still exists. 200 so the scheduler
  // doesn't retry.
  const article = await authorizedPrismaClient.article.findUnique({
    where: { id: body.id },
    select: { removedAt: true },
  });
  if (!article || (article.removedAt && article.removedAt <= new Date())) {
    return new Response("Article was removed", { status: 200 });
  }

  // A non-2xx response makes the scheduler retry. That's safe, as sendNotification
  // skips members who already have this notification and the webhook only posts once.
  if (!(await announceArticle(body, notificationText))) {
    return new Response("Failed to announce article", { status: 500 });
  }

  return new Response("Article created", { status: 201 });
};
