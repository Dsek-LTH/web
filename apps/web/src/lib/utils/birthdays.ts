import { toAppTime } from "$lib/utils/datetime";
import "dayjs/locale/sv";

export const BIRTHDAY_COLORS = [
  "#f280a1",
  "#9966cc",
  "#ffd166",
  "#7dd3fc",
  "#86efac",
];

export const formatBirthday = (birthDate: Date, language: "sv" | "en") =>
  toAppTime(birthDate).locale(language).format("D MMMM");

/** A birth date as the API takes it, "YYYY-MM-DD". */
export const toBirthDateString = (birthDate: Date | null | undefined) =>
  birthDate ? birthDate.toISOString().split("T")[0] : undefined;
