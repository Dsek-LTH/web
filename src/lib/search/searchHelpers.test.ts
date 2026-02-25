import { expect, test } from "vitest";
import { availableSearchIndexes } from "./searchTypes";
import {
	getFederatedWeight,
	getSearchableAttributes,
	mapIndexToMessage,
} from "./searchHelpers";

test("cover all indexes in federated weight", () => {
	for (const index of availableSearchIndexes) {
		expect(
			getFederatedWeight(index),
			`Index ${index} has no federated weight`,
		).toBeGreaterThanOrEqual(1);
	}
	expect(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing purpose
		getFederatedWeight("test" as any),
		`Index test has a federated weight`,
	).toBe(0);
});

test("cover all indexes in searchable attributes", () => {
	for (const index of availableSearchIndexes) {
		expect(
			getSearchableAttributes(index, "sv"),
			`Index ${index} has no searchable attributes for swedish`,
		).not.toHaveLength(0);
		expect(
			getSearchableAttributes(index, "en"),
			`Index ${index} has no searchable attributes for english`,
		).not.toHaveLength(0);
		expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing purpose
			getSearchableAttributes(index, "test" as any),
			`Index ${index} should default to swedish`,
		).not.toHaveLength(0);
	}
	expect(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing purpose
		getSearchableAttributes("test" as any, "sv"),
		`Index test has searchable attributes`,
	).toHaveLength(0);
});

test("cover all indexes in translations", () => {
	for (const index of availableSearchIndexes) {
		expect(
			mapIndexToMessage(index),
			`Index ${index} has no translation`,
		).not.toBe("");
	}
	expect(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing purpose
		mapIndexToMessage("test" as any),
		`Index test has a translation`,
	).toBe("");
});
