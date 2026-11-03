import { appDateKey } from "$lib/utils/datetime";

export const BIRTHDAY_COLORS = [
  "#f280a1",
  "#9966cc",
  "#ffd166",
  "#7dd3fc",
  "#86efac",
];

export const isBirthdayOn = (birthDate: Date | null | undefined, date: Date) =>
  !!birthDate && appDateKey(birthDate).slice(5) === appDateKey(date).slice(5);
