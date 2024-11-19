import {
  toString,
  parseSemester,
  semesterRange,
  startDate,
  endDate,
} from "./semesters";

import { describe, expect, it } from "vitest";

describe("semester", () => {
  it("to string", () => expect(toString(4048)).toBe("VT 2024"));

  it("parse semester", () => expect(parseSemester("VT 2024")).toBe(4048));

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
