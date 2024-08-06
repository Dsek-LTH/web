import { recurringType } from "@prisma/client";

// }
export const recurringTypes: Record<recurringType, string> = {
  [recurringType.DAILY]: "Dagsvis",
  [recurringType.WEEKLY]: "Veckovis",
  [recurringType.MONTHLY]: "Månadsvis",
  [recurringType.YEARLY]: "Årsvis",
};
export const recurringTypesList = Object.keys(recurringTypes);
export function isRecurringType(str: string): str is recurringType {
  return !!recurringTypesList.find((recurringType) => str === recurringType);
}

export function getIncrementType(type: recurringType) {
  switch (type) {
    case recurringType.DAILY:
      return "day";

    case recurringType.WEEKLY:
      return "week";

    case recurringType.MONTHLY:
      return "month";

    case recurringType.YEARLY:
      return "year";
  }
}
