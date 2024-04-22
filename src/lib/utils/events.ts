export const recurringTypes = new Map([
  ["DAILY", "Dagsvis"],
  ["WEEKLY", "Veckovis"],
  ["MONTHLY", "Månadsvis"],
  ["YEARLY", "Årsvis"],
]);
const recurringTypesList = [...recurringTypes.keys()] as const;
export type RecurringType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export function isRecurringType(str: string): str is RecurringType {
  return !!recurringTypesList.find((recurringType) => str === recurringType);
}

export function getIncrementType(recurringType: RecurringType) {
  switch (recurringType) {
    case "DAILY":
      return "day";

    case "WEEKLY":
      return "week";

    case "MONTHLY":
      return "month";

    case "YEARLY":
      return "year";
  }
}
