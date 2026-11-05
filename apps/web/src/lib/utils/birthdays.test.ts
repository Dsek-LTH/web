import { expect, test } from "vitest";
import { formatBirthday, toBirthDateString } from "./birthdays";

test("formats Swedish birthdays with a lowercase month", () => {
  expect(formatBirthday(new Date("1990-11-03T00:00:00Z"), "sv")).toBe(
    "3 november",
  );
});

test("keeps English month capitalization", () => {
  expect(formatBirthday(new Date("1990-11-03T00:00:00Z"), "en")).toBe(
    "3 November",
  );
});

test("sends birth dates as plain dates", () => {
  expect(toBirthDateString(new Date("2000-01-15"))).toBe("2000-01-15");
  expect(toBirthDateString(null)).toBeUndefined();
});
