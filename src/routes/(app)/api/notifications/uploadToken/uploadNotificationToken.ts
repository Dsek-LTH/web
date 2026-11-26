import type { AuthUser } from "@zenstackhq/runtime";

import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { error } from "@sveltejs/kit";

export const uploadNotificationToken = async (
  user: AuthUser,
  token: string,
) => {
  if (!user?.memberId) {
    throw error(401, "Not logged in");
  }
  try {
    // The app sends its token on every page load, so always upsert it: a token
    // can be missing after being reassigned or removed, and a cache would skip
    // recreating it.
    await authorizedPrismaClient.expoToken.upsert({
      update: {
        memberId: user.memberId,
      },
      where: {
        expoToken: token,
      },
      create: {
        memberId: user.memberId,
        expoToken: token,
      },
    });
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      throw error(500, `Couldn't save token: ${e.message}`);
    }
    throw error(500, `Couldn't save token: ${e}`);
  }
};
