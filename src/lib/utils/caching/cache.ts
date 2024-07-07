export type CacheEntry<T> = {
  value: T;
  lastFetched: number; // UNIX epoch number (i.e. Date.now() or date.valueOf()). Smaller in memory than storing Date
  expiresAt: number; // UNIX epoch number (i.e. Date.now() or date.valueOf())
  dependencies?: string[] | undefined;
};
export type CacheStore = Map<string, CacheEntry<unknown>>;
export type Cache = ReturnType<typeof createCache>;
type EntryWithKey<T> = CacheEntry<T> & { key: string };

const DEFAULT_CACHE_TIMEOUT = 1000 * 60 * 5; // 5 minutes

export const createCache = (cache: CacheStore) => {
  const isCacheKeyValid = (key: string, at: number = Date.now()): boolean => {
    const entry = cache.get(key) as EntryWithKey<unknown>;
    if (!entry) return false;
    entry.key = key;
    return isCacheEntryValid(entry, at);
  };

  const isCacheEntryValid = (
    entry: CacheEntry<unknown> | undefined,
    at: number = Date.now(),
  ): boolean => {
    if (!entry) return false;
    if (entry.expiresAt < at) return false;
    return true;
  };

  const updateCacheEntry = <T>(
    key: string,
    value: T,
    at: number = Date.now(),
    cacheTimeout: number = DEFAULT_CACHE_TIMEOUT,
    dependencies?: string | string[],
  ) => {
    const entry = cache.get(key);
    if (entry && entry.lastFetched > at) return; // stored value is newer
    cache.set(key, {
      value,
      lastFetched: at,
      expiresAt: at + cacheTimeout,
      dependencies:
        typeof dependencies === "string" ? [dependencies] : dependencies,
    });
    return value;
  };

  const invalidateCacheEntry = (
    dependency: string,
    at: number = Date.now(),
  ) => {
    for (const [key, entry] of cache) {
      if (
        key === dependency ||
        (entry.dependencies && entry.dependencies.includes(dependency))
      ) {
        if (entry.lastFetched > at) continue; // stored is newer
        cache.set(key, {
          ...entry,
          expiresAt: at,
        });
      }
    }
  };
  return {
    get: cache.get.bind(cache),
    isKeyValid: isCacheKeyValid,
    isEntryValid: isCacheEntryValid,
    update: updateCacheEntry,
    invalidate: invalidateCacheEntry,
  };
};

export enum CacheDependency {
  NEWS = "news",
  EVENTS = "events",
  MEETINGS = "meetings",
  CAFE_OPEN_TIMES = "cafeOpenTimes",
}
