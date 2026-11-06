import { getFullName } from "$lib/utils/client/member";
import { getLocale } from "$paraglide/runtime";
import type { ArticleAuthorSummary } from "./types";

/** Fixed time zone so server and client render the same day around midnight. */
export const NEWS_TIME_ZONE = "Europe/Stockholm";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The custom author's name when the article uses one, otherwise the member's. */
export const getAuthorName = (
  author: Pick<ArticleAuthorSummary, "type" | "member" | "customAuthor">,
) =>
  author.type === "Custom" && author.customAuthor
    ? author.customAuthor.name
    : getFullName(author.member);

/**
 * Compact date for list rows: "3 hours ago" / "2 days ago" for the last week, otherwise
 * "3 Nov" (plus the year if it isn't this year). Shorter than `relativeDate`, which
 * spells out weekday and month for comments.
 */
export const formatPublishedShort = (date: Date) => {
  const diff = date.getTime() - Date.now();
  if (Math.abs(diff) < 7 * DAY_MS) {
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" });
    const hours = Math.round(diff / (60 * 60 * 1000));
    if (Math.abs(hours) < 24)
      return hours === 0
        ? rtf.format(Math.round(diff / 60000), "minute")
        : rtf.format(hours, "hour");
    return rtf.format(Math.round(diff / DAY_MS), "day");
  }
  const yearOf = (d: Date) =>
    d.toLocaleDateString("en", { year: "numeric", timeZone: NEWS_TIME_ZONE });
  return date.toLocaleDateString(getLocale(), {
    day: "numeric",
    month: "short",
    year: yearOf(date) === yearOf(new Date()) ? undefined : "numeric",
    timeZone: NEWS_TIME_ZONE,
  });
};

/** Full date and time, e.g. for a `title` tooltip. */
export const formatPublishedFull = (date: Date) =>
  date.toLocaleString(getLocale(), {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: NEWS_TIME_ZONE,
  });
