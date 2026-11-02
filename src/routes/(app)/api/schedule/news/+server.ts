import { env } from "$env/dynamic/private";
import { announceArticle } from "$lib/news/server/notifications";
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

  // A non-2xx response makes the scheduler retry. That's safe for members, as
  // sendNotification skips anyone who already has this notification.
  if (!(await announceArticle(body, notificationText))) {
    return new Response("Failed to announce article", { status: 500 });
  }

  return new Response("Article created", { status: 201 });
};
