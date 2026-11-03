import { expect, test } from "vitest";
import { getSeasonalEffect } from "./seasonalEffects";

test("snows throughout December", () => {
  expect(getSeasonalEffect(new Date("2026-12-01T12:00:00Z"))).toBe("snow");
  expect(getSeasonalEffect(new Date("2026-12-31T12:00:00Z"))).toBe("snow");
});

test("does not snow outside December", () => {
  expect(getSeasonalEffect(new Date("2026-01-01T12:00:00Z"))).toBeNull();
});

test("shows clovers on Saint Patrick's Day", () => {
  expect(getSeasonalEffect(new Date("2027-03-17T12:00:00Z"))).toBe("clover");
});

test("uses the app timezone for Saint Patrick's Day", () => {
  expect(getSeasonalEffect(new Date("2027-03-16T23:30:00Z"))).toBe("clover");
});

test("shows darts through the likely DÖMD window", () => {
  expect(getSeasonalEffect(new Date("2026-03-20T12:00:00Z"))).toBe("darts");
  expect(getSeasonalEffect(new Date("2026-04-15T12:00:00Z"))).toBe("darts");
  expect(getSeasonalEffect(new Date("2026-04-30T12:00:00Z"))).toBe("darts");
});

test("does not show darts outside the likely DÖMD window", () => {
  expect(getSeasonalEffect(new Date("2026-03-19T12:00:00Z"))).toBeNull();
  expect(getSeasonalEffect(new Date("2026-05-01T12:00:00Z"))).toBeNull();
});

test("returns null when no seasonal effect is active", () => {
  expect(getSeasonalEffect(new Date("2026-06-15T12:00:00Z"))).toBeNull();
});
