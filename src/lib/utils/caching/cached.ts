import type { CacheEntry } from "$lib/utils/caching/cache";
import globalCache from "$lib/utils/caching/globalCache";
import {
  invalidateUserCaches,
  userCache,
} from "$lib/utils/caching/userSpecificCaches";
import type { AuthUser } from "@zenstackhq/runtime";

/**
 * Handles caching of the given callback method. The cached value is stored globally for all users.
 * @param key A unique key for this resource. If the keys are the same we assume the other parameters to also be the same.
 * @param fetchData Callback method to get the resource.
 * @param dependencies Keys of other cache methods which this depends on, this will be a cache miss if any of those are cache misses.
 * @param cacheTimeout How long this resource should be kept in cache.
 * @returns
 */
export const globallyCached = async <T, Args extends unknown[]>(
  key: string,
  fetchData: (...args: Args) => Promise<T>,
  dependencies?: string | string[] | undefined,
  cacheTimeout?: number | undefined,
  ...args: Args
): Promise<T> => {
  const entry = globalCache.get(key) as CacheEntry<T>;
  if (globalCache.isEntryValid(entry)) return entry!.value;
  console.warn(
    "GLOBAL CACHE MISS!",
    key,
    entry?.expiresAt ? entry.expiresAt < Date.now() : undefined,
  );
  const fetchedAt = Date.now();
  const result = await fetchData(...args);
  globalCache.update(key, result, fetchedAt, cacheTimeout, dependencies);
  return result;
};

/**
 * Handles caching of the given callback method. The stored values are cached on a per-user basis.
 * @param key A unique key for this resource. If the keys are the same we assume the other parameters to also be the same.
 * @param fetchData Callback method to get the resource.
 * @param dependencies Keys of other cache methods which this depends on, this will be a cache miss if any of those are cache misses.
 * @param cacheTimeout How long this resource should be kept in cache.
 * @returns
 */
export const userLevelCached = async <T, Args extends unknown[]>(
  user: AuthUser,
  key: string,
  fetchData: (user: AuthUser, ...args: Args) => Promise<T>,
  dependencies?: string | string[] | undefined,
  cacheTimeout?: number | undefined,
  ...args: Args
): Promise<T> => {
  if (!user.memberId)
    // anonymous user
    return globallyCached(
      key,
      fetchData,
      dependencies,
      cacheTimeout,
      user,
      ...args,
    );
  const cache = userCache(user.memberId);
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (cache.isEntryValid(entry)) return entry!.value;
  console.warn("CACHE MISS!", key, entry);
  const fetchedAt = Date.now();
  const result = await fetchData(user, ...args);
  cache.update(key, result, fetchedAt, cacheTimeout, dependencies);
  return result;
};

export const invalidateDependency = (
  dependency: string,
  at: number = Date.now(),
) => {
  globalCache.invalidate(dependency, at);
  invalidateUserCaches(dependency, at);
};
