import { expect, test } from "vitest";
import { isBirthdayOn } from "./birthdays";

test("matches birthdays by month and day", () => {
  expect(
    isBirthdayOn(
      new Date("1990-11-03T00:00:00Z"),
      new Date("2026-11-03T12:00:00Z"),
    ),
  ).toBe(true);
});

test("does not match a different day", () => {
  expect(
    isBirthdayOn(
      new Date("1990-11-03T00:00:00Z"),
      new Date("2026-11-04T12:00:00Z"),
    ),
  ).toBe(false);
});

test("compares dates in the app timezone", () => {
  expect(
    isBirthdayOn(
      new Date("1990-01-01T00:00:00Z"),
      new Date("2025-12-31T23:30:00Z"),
    ),
  ).toBe(true);
});

test("returns false when no birthday is set", () => {
  expect(isBirthdayOn(null, new Date("2026-11-03T12:00:00Z"))).toBe(false);
});
