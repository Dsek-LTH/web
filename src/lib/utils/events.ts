import type { recurringType } from "@prisma/client";

// Vite doesn't support importing prisma enums into the browser, so we have to do this "hack" to use the following object as an enum.

export type RecurringType = recurringType;
export const recurringTypeValues: Record<RecurringType, RecurringType> = {
	DAILY: "DAILY",
	WEEKLY: "WEEKLY",
	MONTHLY: "MONTHLY",
	YEARLY: "YEARLY",
} as const;
export const recurringTypes: Record<RecurringType, string> = {
	DAILY: "Dagsvis",
	WEEKLY: "Veckovis",
	MONTHLY: "Månadsvis",
	YEARLY: "Årsvis",
};
export const recurringTypesList = Object.keys(recurringTypeValues);
export function isRecurringType(str: string): str is RecurringType {
	return !!recurringTypesList.find((recurringType) => str === recurringType);
}

export function getIncrementType(type: RecurringType) {
	switch (type) {
		case recurringTypeValues.DAILY:
			return "day";

		case recurringTypeValues.WEEKLY:
			return "week";

		case recurringTypeValues.MONTHLY:
			return "month";

		case recurringTypeValues.YEARLY:
			return "year";
	}
	throw new Error("Invalid recurring type");
}
