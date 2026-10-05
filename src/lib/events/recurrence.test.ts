import { describe, expect, it } from "vitest";
import { generateOccurrences, retimeOccurrence } from "./recurrence";

// Independent of dayjs: read the Stockholm wall clock straight from Intl
const stockholm = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const wall = (d: Date) => stockholm.format(d).replace(",", ""); // "2026-10-25 18:00"

// Instants given as Stockholm wall-clock time, so the tests don't depend on DST math themselves
const at = (isoWithOffset: string) => new Date(isoWithOffset);

describe("generateOccurrences", () => {
  it("keeps weekly events at the same wall-clock time across DST end", () => {
    const occurrences = generateOccurrences(
      {
        start: at("2026-10-19T18:00:00+02:00"),
        end: at("2026-10-19T20:00:00+02:00"),
      },
      at("2026-11-09T12:00:00+01:00"),
      1,
      "week",
    );
    expect(occurrences.map((o) => wall(o.start))).toEqual([
      "2026-10-19 18:00",
      "2026-10-26 18:00",
      "2026-11-02 18:00",
      "2026-11-09 18:00",
    ]);
    expect(occurrences.map((o) => wall(o.end))).toEqual([
      "2026-10-19 20:00",
      "2026-10-26 20:00",
      "2026-11-02 20:00",
      "2026-11-09 20:00",
    ]);
  });

  it("keeps weekly events at the same wall-clock time across DST start", () => {
    const occurrences = generateOccurrences(
      {
        start: at("2026-03-23T18:00:00+01:00"),
        end: at("2026-03-23T20:00:00+01:00"),
      },
      at("2026-04-06T12:00:00+02:00"),
      1,
      "week",
    );
    expect(occurrences.map((o) => wall(o.start))).toEqual([
      "2026-03-23 18:00",
      "2026-03-30 18:00",
      "2026-04-06 18:00",
    ]);
  });

  // The day of the change itself is the tricky one: midnight and 18:00 have different offsets
  it.each([
    ["DST end", "2026-10-22T18:00:00+02:00", "2026-10-28T12:00:00+01:00"],
    ["DST start", "2026-03-27T18:00:00+01:00", "2026-04-02T12:00:00+02:00"],
  ])("gets every daily occurrence right around %s", (_, first, last) => {
    const start = at(first);
    const occurrences = generateOccurrences(
      { start, end: new Date(start.getTime() + 2 * 60 * 60 * 1000) },
      at(last),
      1,
      "day",
    );
    expect(occurrences.length).toBe(7);
    for (const o of occurrences) {
      expect(wall(o.start).slice(11)).toBe("18:00");
      expect(wall(o.end).slice(11)).toBe("20:00");
    }
  });

  it("keeps overnight events overnight", () => {
    const occurrences = generateOccurrences(
      {
        start: at("2026-10-23T22:00:00+02:00"),
        end: at("2026-10-24T02:00:00+02:00"),
      },
      at("2026-11-06T12:00:00+01:00"),
      1,
      "week",
    );
    expect(occurrences.map((o) => [wall(o.start), wall(o.end)])).toEqual([
      ["2026-10-23 22:00", "2026-10-24 02:00"],
      ["2026-10-30 22:00", "2026-10-31 02:00"],
      ["2026-11-06 22:00", "2026-11-07 02:00"],
    ]);
  });

  it("respects the separation count and includes the last day", () => {
    const occurrences = generateOccurrences(
      {
        start: at("2026-10-05T12:00:00+02:00"),
        end: at("2026-10-05T13:00:00+02:00"),
      },
      at("2026-11-02T08:00:00+01:00"), // last day, but earlier in the day than the event
      2,
      "week",
    );
    expect(occurrences.map((o) => wall(o.start))).toEqual([
      "2026-10-05 12:00",
      "2026-10-19 12:00",
      "2026-11-02 12:00",
    ]);
  });

  it("treats the last day by its Stockholm date, not the UTC date", () => {
    const occurrences = generateOccurrences(
      {
        start: at("2026-10-05T00:30:00+02:00"),
        end: at("2026-10-05T01:30:00+02:00"),
      },
      at("2026-10-12T00:10:00+02:00"), // 2026-10-11T22:10Z: still the 11th in UTC
      1,
      "week",
    );
    expect(occurrences.map((o) => wall(o.start))).toEqual([
      "2026-10-05 00:30",
      "2026-10-12 00:30",
    ]);
  });
});

describe("retimeOccurrence", () => {
  it("moves an occurrence to new wall-clock times on its own date, across DST", () => {
    // Occurrence on the DST-end day, retimed with a template from before it
    const { start, end } = retimeOccurrence(
      { start: at("2026-10-25T18:00:00+01:00") },
      {
        start: at("2026-10-19T19:30:00+02:00"),
        end: at("2026-10-19T21:00:00+02:00"),
      },
    );
    expect(wall(start)).toBe("2026-10-25 19:30");
    expect(wall(end)).toBe("2026-10-25 21:00");
  });

  it("keeps overnight duration", () => {
    const { start, end } = retimeOccurrence(
      { start: at("2026-11-06T22:00:00+01:00") },
      {
        start: at("2026-10-23T23:00:00+02:00"),
        end: at("2026-10-24T03:00:00+02:00"),
      },
    );
    expect(wall(start)).toBe("2026-11-06 23:00");
    expect(wall(end)).toBe("2026-11-07 03:00");
  });
});
