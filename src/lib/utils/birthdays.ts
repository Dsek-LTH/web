import { toAppTime } from "$lib/utils/datetime";
import "dayjs/locale/sv";

export const BIRTHDAY_COLORS = [
  "#f280a1",
  "#9966cc",
  "#ffd166",
  "#7dd3fc",
  "#86efac",
];

export const isBirthdayOn = (
  birthDate: Date | null | undefined,
  date: Date,
) => {
  if (!birthDate) return false;
  const today = toAppTime(date);
  return toAppTime(birthDate).year(today.year()).isSame(today, "day");
};

export const formatBirthday = (birthDate: Date, language: "sv" | "en") =>
  toAppTime(birthDate).locale(language).format("D MMMM");
