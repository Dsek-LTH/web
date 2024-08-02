import { isNollningPeriod } from "$lib/utils/adminSettings/nollning.js";

export const load = async () => {
  return {
    isNollning: await isNollningPeriod(),
  };
};
