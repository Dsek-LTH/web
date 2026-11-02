import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { APP_TIMEZONE, appDateKey } from "$lib/utils/datetime";

import {
  getMonthRange,
  getMonthWeeks,
  layoutMonth,
  placeWeekEvents,
} from "./monthCalendar";

const format = (weeks: ReturnType<typeof getMonthWeeks>) =>
  weeks.map((week) => week.map((day) => day.format("YYYY-MM-DD")));

const at = (value: string) => dayjs.tz(value, APP_TIMEZONE).toDate();

const event = (id: string, start: string, end: string) => ({
  id,
  title: id,
  slug: id,
  startDatetime: at(start),
  endDatetime: at(end),
  isCancelled: false,
});

const weekStarting = (month: string, date: string) =>
  getMonthWeeks(month).find((week) => week[0]!.format("YYYY-MM-DD") === date)!;

describe("getMonthWeeks", () => {
  it("pads a month that starts on a Sunday to whole Monday weeks", () => {
    const weeks = format(getMonthWeeks("2026-11"));

    expect(weeks).toHaveLength(6);
    expect(weeks[0]![0]).toBe("2026-10-26");
    expect(weeks.at(-1)!.at(-1)).toBe("2026-12-06");
  });

  it("does not add an empty week to a month that fits in five weeks", () => {
    const weeks = format(getMonthWeeks("2026-06"));

    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toBe("2026-06-01");
    expect(weeks.at(-1)!.at(-1)).toBe("2026-07-05");
  });
});

describe("getMonthRange", () => {
  it("returns the padded grid range and the calendar month range", () => {
    const range = getMonthRange("2026-11");

    expect(range.weeks).toHaveLength(6);
    expect(appDateKey(range.startingAt)).toBe("2026-10-26");
    expect(appDateKey(range.endingAt)).toBe("2026-12-07");
    expect(appDateKey(range.monthStart)).toBe("2026-11-01");
    expect(appDateKey(range.monthEnd)).toBe("2026-12-01");
  });
});

describe("placeWeekEvents", () => {
  const week = weekStarting("2026-11", "2026-11-09");

  it("shares a row when events are on different days", () => {
    const { events, rowCount } = placeWeekEvents(
      [
        event("a", "2026-11-10 10:00", "2026-11-10 11:00"),
        event("b", "2026-11-12 10:00", "2026-11-12 11:00"),
        event("c", "2026-11-10 12:00", "2026-11-10 13:00"),
      ],
      week,
    );

    expect(rowCount).toBe(2);
    expect(events.find(({ id }) => id === "a")).toMatchObject({
      startColumn: 2,
      endColumn: 3,
      row: 0,
    });
    expect(events.find(({ id }) => id === "b")).toMatchObject({
      startColumn: 4,
      endColumn: 5,
      row: 0,
    });
    expect(events.find(({ id }) => id === "c")).toMatchObject({
      startColumn: 2,
      endColumn: 3,
      row: 1,
    });
  });

  it("clips events to the week boundaries", () => {
    const { events, rowCount } = placeWeekEvents(
      [event("a", "2026-11-08 23:00", "2026-11-16 01:00")],
      week,
    );

    expect(rowCount).toBe(1);
    expect(events[0]).toMatchObject({
      startColumn: 1,
      endColumn: 8,
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  it("keeps a Sunday to Monday event on the correct side of each week", () => {
    const sundayToMonday = event("a", "2026-11-15 23:00", "2026-11-16 01:00");

    expect(placeWeekEvents([sundayToMonday], week).events[0]).toMatchObject({
      startColumn: 7,
      endColumn: 8,
      continuesBefore: false,
      continuesAfter: true,
    });
    expect(
      placeWeekEvents([sundayToMonday], weekStarting("2026-11", "2026-11-16"))
        .events[0],
    ).toMatchObject({
      startColumn: 1,
      endColumn: 2,
      continuesBefore: true,
      continuesAfter: false,
    });
  });

  it("does not paint the next day for an event ending at midnight", () => {
    const midnight = event("a", "2026-11-10 20:00", "2026-11-11 00:00");

    expect(placeWeekEvents([midnight], week).events[0]).toMatchObject({
      startColumn: 2,
      endColumn: 3,
      continuesBefore: false,
      continuesAfter: false,
    });
    expect(
      placeWeekEvents([midnight], weekStarting("2026-11", "2026-11-16")).events,
    ).toHaveLength(0);
  });

  it("maps UTC instants to Stockholm calendar days across DST", () => {
    const dstWeek = weekStarting("2026-03", "2026-03-30");
    const { events } = placeWeekEvents(
      [
        {
          ...event("a", "2026-03-30 00:30", "2026-03-30 01:30"),
          startDatetime: new Date("2026-03-29T22:30:00Z"),
          endDatetime: new Date("2026-03-29T23:30:00Z"),
        },
      ],
      dstWeek,
    );

    expect(events[0]).toMatchObject({
      startColumn: 1,
      endColumn: 2,
      continuesBefore: false,
    });
  });
});

describe("layoutMonth", () => {
  it("places events into their week in the month layout", () => {
    const { weeks } = getMonthRange("2026-11");
    const laidOut = layoutMonth(
      [event("a", "2026-11-10 10:00", "2026-11-10 11:00")],
      weeks,
    );
    const week = laidOut.find(
      ({ days }) => days[0]!.format("YYYY-MM-DD") === "2026-11-09",
    )!;

    expect(week.events).toHaveLength(1);
    expect(week.rowCount).toBe(1);
  });
});
