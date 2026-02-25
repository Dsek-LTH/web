import { describe, it, expect } from "vitest";
import { convertPriceToCents } from "./convertPrice";

describe("helper.ts", () => {
	describe("convertPriceToNumber", () => {
		it("should convert price in kr to ören", () => {
			expect(convertPriceToCents(123.45)).toBe(12345);
			expect(convertPriceToCents(0)).toBe(0);
			expect(convertPriceToCents(1.99)).toBe(199);
			expect(convertPriceToCents(19.9)).toBe(1990);
		});
	});
});
