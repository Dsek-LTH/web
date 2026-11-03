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
  const birthday = toAppTime(birthDate);
  const today = toAppTime(date);
  return birthday.month() === today.month() && birthday.date() === today.date();
};

export const formatBirthday = (birthDate: Date, language: "sv" | "en") =>
  toAppTime(birthDate).locale(language).format("D MMMM");
