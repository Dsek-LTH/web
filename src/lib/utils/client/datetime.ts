import { languageTag } from "$paraglide/runtime";

export const relativeDate = (date: Date) => {
  const formatter = new Intl.RelativeTimeFormat(languageTag(), {
    numeric: "auto",
  });
  const diff = date.getTime() - Date.now();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  if (Math.abs(days) < 3) return formatter.format(days, "day");
  if (date.getFullYear() == new Date(Date.now()).getFullYear())
    return date.toLocaleDateString(languageTag(), {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return date.toLocaleDateString(languageTag(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
