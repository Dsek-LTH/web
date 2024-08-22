import { env } from "$env/dynamic/private";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";

export const load = async () => {
  return {
    isNollning: await isNollningPeriod(),
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
  };
};
