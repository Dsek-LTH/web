import {
  createCache,
  type Cache,
  type CacheEntry,
  type CacheStore,
} from "./cache";

const globalCacheStore: CacheStore = new Map<string, CacheEntry<unknown>>();

const globalCache: Cache = createCache(globalCacheStore);

export default globalCache;
