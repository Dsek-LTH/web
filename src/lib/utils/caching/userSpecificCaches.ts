import { createCache, type Cache, type CacheEntry } from "./cache";

const userCacheStores: Record<string, Cache> = {};
export const userCache = (key: string) => {
  const cache = userCacheStores[key];
  if (cache) return cache!;
  const store = new Map<string, CacheEntry<unknown>>();
  const newCache: Cache = createCache(store);
  userCacheStores[key] = newCache;
  return newCache;
};

export const invalidateUserCaches = (
  dependency: string,
  at: number = Date.now(),
) => {
  Object.keys(userCacheStores).forEach((key) => {
    userCache(key).invalidate(dependency, at);
  });
};
