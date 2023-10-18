export const relativeDate = (date: Date) => {
  const formatter = new Intl.RelativeTimeFormat("sv", {
    numeric: "auto",
  });
  const diff = date.getTime() - (Date.now() + 1000 * 60 * 60 * 24 * 12);
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  if (Math.abs(days) < 3) return formatter.format(days, "day");
  return date.toLocaleDateString("sv", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};
