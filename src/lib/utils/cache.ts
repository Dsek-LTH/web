/** Default cache time is 15 minutes */
export function withCache<T>(fn: () => T, seconds = 15 * 60) {
	let cache: T | null = null;
	let cacheTime: number | null = null;
	const duration = seconds * 1000; // in milliseconds

	const get = () => {
		const now = Date.now();

		// Check if the cache is expired or hasn't been set yet
		if (cache === null || (cacheTime !== null && now - cacheTime > duration)) {
			// Recalculate and update the cache
			cache = fn();
			cacheTime = now;
		}

		// Return the cached value
		return cache;
	};

	const invalidate = () => {
		cache = null;
		cacheTime = null;
	};

	return { get, invalidate };
}
