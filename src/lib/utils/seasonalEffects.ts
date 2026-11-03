import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { appDayStart, toAppTime } from "$lib/utils/datetime";

dayjs.extend(isBetween);

export type SeasonalEffect = "snow" | "clover" | "darts";

// Manually maintained DÖMD dates (Thursday–Saturday). These are guesses
// until the dates are announced; update this list each year.
const DÖMD_DATES = [
  // 2025
  "2025-04-10",
  "2025-04-11",
  "2025-04-12",
  // 2026
  "2026-04-16",
  "2026-04-17",
  "2026-04-18",
  // 2027
  "2027-04-15",
  "2027-04-16",
  "2027-04-17",
  // 2028
  "2028-04-20",
  "2028-04-21",
  "2028-04-22",
] as const;

export const getSeasonalEffect = (date: Date): SeasonalEffect | null => {
  const today = toAppTime(date);
  const year = today.year();

  // Snow: all of December.
  const decemberStart = toAppTime(`${year}-12-01`);
  const decemberEnd = toAppTime(`${year}-12-31`);
  if (today.isBetween(decemberStart, decemberEnd, "day", "[]")) return "snow";

  // Saint Patrick's Day: March 17.
  if (today.isSame(toAppTime(`${year}-03-17`), "day")) return "clover";

  // DÖMD: use the manually maintained dates above.
  if (DÖMD_DATES.some((date) => today.isSame(appDayStart(date), "day")))
    return "darts";

  return null;
};
