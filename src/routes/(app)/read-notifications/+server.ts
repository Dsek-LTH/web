import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import type { RequestHandler } from "./$types";

// Read notification
const readNotifications: RequestHandler = async ({ locals, url }) => {
  const { prisma, user } = locals;
  const notificationID = url.searchParams.get("id")?.toLowerCase() ?? null;

  if (!user || !isAuthorized(apiNames.LOGGED_IN, user)) {
    return new Response(null, { status: 401 });
  }

  if (notificationID === null) {
    await prisma.notification.updateMany({
      where: {
        memberId: user.memberId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return new Response("All notifications read", { status: 200 });
  } else {
    const parsedId = Number.parseInt(notificationID);
    if (Number.isNaN(parsedId)) {
      return new Response("Invalid notification ID", { status: 400 });
    }
    await prisma.notification.update({
      where: {
        memberId: user.memberId,
        id: parsedId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return new Response("Notification read", { status: 200 });
  }
};

export const PUT = readNotifications;
