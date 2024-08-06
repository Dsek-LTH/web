import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";

export const load = async () => {
  return {
    isNollning: await isNollningPeriod(),
  };
};
