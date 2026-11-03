import { toAppTime } from "$lib/utils/datetime";

export type SeasonalEffect = "snow" | "clover" | "darts";

export const getSeasonalEffect = (date: Date): SeasonalEffect | null => {
  const today = toAppTime(date);

  if (today.month() === 11) return "snow";
  if (today.format("MM-DD") === "03-17") return "clover";

  if (today.month() === 3) {
    const mayFirst = today.startOf("year").add(4, "month");
    const daysBack = mayFirst.day() === 0 ? 1 : mayFirst.day() + 1;
    const saturday = mayFirst.subtract(daysBack, "day");
    if (
      today.isSame(saturday, "day") ||
      today.isSame(saturday.add(1, "day"), "day")
    )
      return "darts";
  }

  return null;
};
