import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { toAppTime } from "$lib/utils/datetime";

dayjs.extend(isBetween);

export type SeasonalEffect = "snow" | "clover" | "darts";

export const getSeasonalEffect = (date: Date): SeasonalEffect | null => {
  const today = toAppTime(date);
  const year = today.year();

  // Snow: all of December.
  const decemberStart = toAppTime(`${year}-12-01`);
  const decemberEnd = toAppTime(`${year}-12-31`);
  if (today.isBetween(decemberStart, decemberEnd, "day", "[]")) return "snow";

  // Saint Patrick's Day: March 17.
  if (today.isSame(toAppTime(`${year}-03-17`), "day")) return "clover";

  // DÖMD: the last Saturday and Sunday before May 1.
  const mayFirst = toAppTime(`${year}-05-01`);
  const daysBack = mayFirst.day() === 0 ? 1 : mayFirst.day() + 1;
  const dartsSaturday = mayFirst.subtract(daysBack, "day");
  if (
    today.isSame(dartsSaturday, "day") ||
    today.isSame(dartsSaturday.add(1, "day"), "day")
  )
    return "darts";

  return null;
};
