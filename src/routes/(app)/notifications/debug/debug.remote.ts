import { form, getRequestEvent } from "$app/server";
import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import z from "zod";

const baseFields = {
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(255),
  type: z
    .string()
    .refine(
      (v): v is NotificationType =>
        Object.values(NotificationType).includes(v as NotificationType),
      { message: "Unknown notification type" },
    ),
  link: z.string().min(1).max(500),
  count: z
    .string()
    .optional()
    .transform((v) => {
      const n = v ? Number(v) : 1;
      if (!Number.isFinite(n) || n < 1) return 1;
      return Math.min(50, Math.floor(n));
    }),
  fromSelf: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
};

const debugSchema = z.object(baseFields);

/**
 * Dev-only helper to create a test notification for the current user.
 * Bypasses subscription settings checks by writing directly to the
 * notification table.
 */
export const createDebugNotification = form(debugSchema, async (data) => {
  if (!dev) {
    error(404, "Not Found");
  }
  const { user, prisma } = getRequestEvent().locals;
  if (!user?.memberId) {
    return {
      message: "Not logged in",
      type: "error" as const,
    };
  }

  let fromAuthorId: string | undefined;
  if (data.fromSelf) {
    const author = await prisma.author.findFirst({
      where: { memberId: user.memberId, mandateId: null, customId: null },
    });
    fromAuthorId =
      author?.id ??
      (await prisma.author.create({ data: { memberId: user.memberId } })).id;
  }

  await prisma.notification.createMany({
    data: Array.from({ length: data.count }).map(() => ({
      title: data.title,
      message: data.message,
      type: data.type as NotificationType,
      link: data.link,
      memberId: user.memberId!,
      fromAuthorId,
    })),
  });

  return {
    message: `Created ${data.count} test notification${data.count === 1 ? "" : "s"}`,
    type: "success" as const,
  };
});

const broadcastSchema = z.object({
  ...baseFields,
  memberIds: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),
});

/**
 * Dev-only helper that goes through the real `sendNotification` pipeline
 * (subscription checks, push notifications, etc).
 */
export const sendDebugNotification = form(broadcastSchema, async (data) => {
  if (!dev) {
    error(404, "Not Found");
  }
  const { user } = getRequestEvent().locals;
  if (!user?.memberId) {
    return {
      message: "Not logged in",
      type: "error" as const,
    };
  }

  const memberIds =
    data.memberIds.length > 0 ? data.memberIds : [user.memberId];

  const baseProps = {
    title: data.title,
    message: data.message,
    type: data.type as NotificationType,
    link: data.link,
    memberIds,
  };
  if (data.fromSelf) {
    await sendNotification({ ...baseProps, fromMemberId: user.memberId });
  } else {
    await sendNotification(baseProps);
  }

  return {
    message: `Dispatched notification to ${memberIds.length} member${memberIds.length === 1 ? "" : "s"}`,
    type: "success" as const,
  };
});
