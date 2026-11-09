import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/sv";
import { getFullName } from "$lib/utils/client/member";
import { toAppTime } from "$lib/utils/datetime";
import { getLocale } from "$paraglide/runtime";
import type { ArticleAuthorSummary } from "./types";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

/**
 * In the app time zone, so server and client render the same day around midnight,
 * and in the current language.
 */
const inAppTime = (date: Date) => toAppTime(date).locale(getLocale());

/** The custom author's name when the article uses one, otherwise the member's. */
export const getAuthorName = (
  author: Pick<ArticleAuthorSummary, "type" | "member" | "customAuthor">,
) =>
  author.type === "Custom" && author.customAuthor
    ? author.customAuthor.name
    : getFullName(author.member);

/** E.g. "Nov 3, 2026" / "3 nov 2026". */
export const formatDateShort = (date: Date) => inAppTime(date).format("ll");

/** E.g. "November 3, 2026" / "3 november 2026". */
export const formatDateLong = (date: Date) => inAppTime(date).format("LL");

/** E.g. "Nov 3, 2026 2:30 PM" / "3 nov 2026 14:30". */
export const formatDateTimeShort = (date: Date) =>
  inAppTime(date).format("lll");

/** Full date and time, e.g. for a `title` tooltip. */
export const formatPublishedFull = (date: Date) =>
  inAppTime(date).format("LLL");

/**
 * Compact date for list rows: "3 hours ago" / "2 days ago" for the last week, otherwise
 * "3 Nov" (plus the year if it isn't this year).
 */
export const formatPublishedShort = (date: Date) => {
  const published = inAppTime(date);
  const now = toAppTime(new Date());
  if (now.diff(published, "day") < 7) return published.fromNow();
  return published.format(published.isSame(now, "year") ? "D MMM" : "ll");
};
