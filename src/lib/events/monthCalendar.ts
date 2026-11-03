import dayjs, { type Dayjs } from "dayjs";

import { appDateKey, appDayStart, appEndDateKey } from "$lib/utils/datetime";

/** Returns the days of a month grid, in whole weeks starting on Monday. */
export const getMonthWeeks = (month: string): Dayjs[][] => {
  const first = dayjs.utc(`${month}-01`);
  const last = first.endOf("month");
  const start = first.subtract((first.day() + 6) % 7, "day");
  const end = last.add((7 - last.day()) % 7, "day");
  const dayCount = end.diff(start, "day") + 1;

  return Array.from({ length: dayCount / 7 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => start.add(week * 7 + day, "day")),
  );
};

export type MonthEvent = {
  id: string;
  title: string;
  slug: string | null;
  startDatetime: Date;
  endDatetime: Date;
  isCancelled: boolean | null;
};

export type PlacedMonthEvent = MonthEvent & {
  startColumn: number;
  endColumn: number;
  row: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

/** The day grid plus the instants needed for month and grid queries. */
export const getMonthRange = (month: string) => {
  const weeks = getMonthWeeks(month);
  const firstKey = weeks[0]![0]!.format("YYYY-MM-DD");
  const lastKey = weeks.at(-1)![6]!.format("YYYY-MM-DD");
  const endExclusiveKey = dayjs.utc(lastKey).add(1, "day").format("YYYY-MM-DD");
  const monthStartKey = `${month}-01`;
  const monthEndKey = dayjs
    .utc(monthStartKey)
    .add(1, "month")
    .format("YYYY-MM-DD");

  return {
    weeks,
    startingAt: appDayStart(firstKey),
    endingAt: appDayStart(endExclusiveKey),
    monthStart: appDayStart(monthStartKey),
    monthEnd: appDayStart(monthEndKey),
  };
};

/** Places the events overlapping a week into non-overlapping rows. */
export const placeWeekEvents = (
  events: MonthEvent[],
  week: Dayjs[],
): { events: PlacedMonthEvent[]; rowCount: number } => {
  const weekStartKey = week[0]!.format("YYYY-MM-DD");
  const weekEndKey = week[6]!.format("YYYY-MM-DD");
  const weekStart = dayjs.utc(weekStartKey);
  const rows: Array<Array<{ start: number; end: number }>> = [];
  const placed: PlacedMonthEvent[] = [];

  const sorted = [...events].sort(
    (a, b) =>
      dayjs(a.startDatetime).valueOf() - dayjs(b.startDatetime).valueOf(),
  );

  for (const event of sorted) {
    const startKey = appDateKey(event.startDatetime);
    const endKey = appEndDateKey(event.endDatetime);

    if (startKey > weekEndKey || endKey < weekStartKey) continue;

    const startColumn = Math.max(
      1,
      Math.min(7, dayjs.utc(startKey).diff(weekStart, "day") + 1),
    );
    const endColumn = Math.max(
      2,
      Math.min(8, dayjs.utc(endKey).diff(weekStart, "day") + 2),
    );
    const row = rows.findIndex((spans) =>
      spans.every((span) => span.end <= startColumn || endColumn <= span.start),
    );
    const rowIndex = row === -1 ? rows.length : row;

    (rows[rowIndex] ??= []).push({ start: startColumn, end: endColumn });
    placed.push({
      ...event,
      startColumn,
      endColumn,
      row: rowIndex,
      continuesBefore: startKey < weekStartKey,
      continuesAfter: endKey > weekEndKey,
    });
  }

  return { events: placed, rowCount: rows.length };
};

/** Lays out the events for every week in the month grid. */
export const layoutMonth = (events: MonthEvent[], weeks: Dayjs[][]) =>
  weeks.map((days) => ({
    days,
    ...placeWeekEvents(events, days),
  }));
