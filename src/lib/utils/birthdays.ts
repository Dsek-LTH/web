import { appDateKey } from "$lib/utils/datetime";

export const isBirthdayOn = (birthDate: Date | null | undefined, date: Date) =>
  !!birthDate && appDateKey(birthDate).slice(5) === appDateKey(date).slice(5);
