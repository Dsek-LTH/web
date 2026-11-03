import { APP_TIMEZONE, appDateKey } from "$lib/utils/datetime";

export const BIRTHDAY_COLORS = [
  "#f280a1",
  "#9966cc",
  "#ffd166",
  "#7dd3fc",
  "#86efac",
];

export const isBirthdayOn = (birthDate: Date | null | undefined, date: Date) =>
  !!birthDate && appDateKey(birthDate).slice(5) === appDateKey(date).slice(5);

export const formatBirthday = (birthDate: Date, language: "sv" | "en") => {
  const parts = new Intl.DateTimeFormat(language === "sv" ? "sv-SE" : "en-GB", {
    day: "numeric",
    month: "long",
    timeZone: APP_TIMEZONE,
  }).formatToParts(birthDate);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${day} ${language === "sv" ? month.toLocaleLowerCase("sv-SE") : month}`;
};
