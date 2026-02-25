import {
	toString,
	semesterRange,
	startDate,
	endDate,
	parseSemesterFromString,
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
