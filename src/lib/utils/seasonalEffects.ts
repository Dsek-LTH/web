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

  // DÖMD: usually held between late March and the end of April.
  // The exact weekend varies each year, so cover the whole likely window.
  const dartsStart = toAppTime(`${year}-03-20`);
  const dartsEnd = toAppTime(`${year}-04-30`);
  if (today.isBetween(dartsStart, dartsEnd, "day", "[]")) return "darts";

  return null;
};
