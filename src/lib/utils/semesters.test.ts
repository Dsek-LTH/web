import {
  toString,
  semesterRange,
  startDate,
  endDate,
  parseSemesterFromString,
  dateToSemester,
  FIRST_MEDALS_SEMESTER,
  isMedalsSemester,
  semesterFromYearAndTerm,
} from "./semesters";

import { describe, expect, it } from "vitest";

describe("semester", () => {
  it("to string", () => expect(toString(4048)).toBe("VT 2024"));

  it("range", () =>
    expect(semesterRange(4048, 4050)).toEqual([4048, 4049, 4050]));

  it("start date spring", () =>
    expect(startDate(4048)).toEqual(new Date(2024, 0, 1)));

  it("start date fall", () =>
    expect(startDate(4049)).toEqual(new Date(2024, 6, 1)));

  it("end date spring", () =>
    expect(endDate(4048)).toEqual(new Date(2024, 6, 1)));

  it("end date fall", () =>
    expect(endDate(4049)).toEqual(new Date(2025, 0, 1)));
});

describe("parseSemester", () => {
  it("parses VT 2024", () =>
    expect(parseSemesterFromString("VT 2024", () => new Error())).toBe(4048));
  it("parses HT 2024", () =>
    expect(parseSemesterFromString("HT 2024", () => new Error())).toBe(4049));
  it("parses VT 2025", () =>
    expect(parseSemesterFromString("VT 2025", () => new Error())).toBe(4050));
  it("parses HT 2025", () =>
    expect(parseSemesterFromString("HT 2025", () => new Error())).toBe(4051));
  it("parses VT 2026", () =>
    expect(parseSemesterFromString("VT 2026", () => new Error())).toBe(4052));
  it("parses HT 2026", () =>
    expect(parseSemesterFromString("HT 2026", () => new Error())).toBe(4053));

  it("throws on invalid semester", () => {
    expect(() =>
      parseSemesterFromString("VT 202", () => new Error()),
    ).toThrow();
    expect(() =>
      parseSemesterFromString("VT 2024a", () => new Error()),
    ).toThrow();
    expect(() =>
      parseSemesterFromString("VT 2024 ", () => new Error()),
    ).toThrow();
    expect(() =>
      parseSemesterFromString("XT 2024", () => new Error()),
    ).toThrow();
    expect(() =>
      parseSemesterFromString("VT 2024 2024", () => new Error()),
    ).toThrow();
    expect(() => parseSemesterFromString("VT24", () => new Error())).toThrow();
    expect(() => parseSemesterFromString("VT", () => new Error())).toThrow();
    expect(() => parseSemesterFromString("2024", () => new Error())).toThrow();
    expect(() => parseSemesterFromString("", () => new Error())).toThrow();
  });
});

describe("isMedalsSemester", () => {
  const now = new Date(2026, 10, 4); // November 2026, HT 2026

  it("accepts the guild's first semester and the current semester", () => {
    expect(isMedalsSemester(FIRST_MEDALS_SEMESTER, now)).toBe(true);
    expect(isMedalsSemester(dateToSemester(now), now)).toBe(true);
  });

  it("rejects semesters before the guild existed", () => {
    expect(isMedalsSemester(semesterFromYearAndTerm(1981, "HT"), now)).toBe(
      false,
    );
  });

  it("rejects future semesters so crawlers cannot walk forever", () => {
    expect(isMedalsSemester(semesterFromYearAndTerm(2027, "VT"), now)).toBe(
      false,
    );
    expect(isMedalsSemester(semesterFromYearAndTerm(2332, "VT"), now)).toBe(
      false,
    );
  });
});
