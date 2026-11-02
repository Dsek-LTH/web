export type ArticleNotificationPlan = "none" | "sendNow" | "schedule";

/**
 * Decides what an article edit should do about the "new article" notification.
 * Only an edit of an article that isn't live yet can announce it, so editing an
 * already published article never notifies anyone again.
 */
export const planArticleNotification = ({
  sendNotification,
  previousPublishedAt,
  publishedAt,
  now,
}: {
  sendNotification: boolean;
  previousPublishedAt: Date | null | undefined;
  publishedAt: Date;
  now: Date;
}): ArticleNotificationPlan => {
  const wasAlreadyLive =
    previousPublishedAt != null && previousPublishedAt <= now;
  if (wasAlreadyLive || !sendNotification) return "none";
  return publishedAt > now ? "schedule" : "sendNow";
};
