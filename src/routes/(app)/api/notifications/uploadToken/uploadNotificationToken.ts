import type { AuthUser } from "@zenstackhq/runtime";

import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { error } from "@sveltejs/kit";

// since this can be called quite often, on every page refresh basically, we want to do an in-memory cache to skip going to the DB
type Token = string;
type MemberId = string;
const cache = new Map<Token, MemberId>(); // contains a map from tokens to the corresponding member id which has been set
// Overtime this cache can grow quite large, becoming slower than going to the db eventually, so for in a set interval we should clear it.
// This is really only a problem if the cache is not cleared for a long time, say a few months or years (highly unlikely the process will not be restarted), but better to be on the safe side
const CACHE_CLEAR_INTERVAL = 7 * 24 * 60 * 60 * 1000; // one week
setInterval(() => {
  cache.clear();
}, CACHE_CLEAR_INTERVAL);

export const uploadNotificationToken = async (
  user: AuthUser,
  token: string,
) => {
  if (!user?.memberId) {
    throw error(401, "Not logged in");
  }
  if (cache.get(token) == user.memberId) return;
  try {
    console.log("uploading token", token);
    const existing = await authorizedPrismaClient.expoToken.findUnique({
      where: {
        expoToken: token,
        memberId: user.memberId,
      },
    });
    if (existing) {
      console.log("already exists");
      cache.set(token, user.memberId);
      return;
    }
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
    cache.set(token, user.memberId);
  } catch (e) {
    console.log(e);
    if (e instanceof Error) {
      throw error(500, `Couldn't save token: ${e.message}`);
    }
    throw error(500, `Couldn't save token: ${e}`);
  }
};
