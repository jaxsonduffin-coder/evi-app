// =============================================
// EVI - Simple in-memory cache with TTL
// Keeps Firestore responses cached across navigation
// =============================================

import { useEffect, useState, useRef, useCallback } from 'react';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const CACHE = new Map<string, CacheEntry<any>>();

/**
 * Cached async data hook. Serves stale-while-revalidate.
 *
 * Usage:
 *   const { data, loading, refresh } = useCache(
 *     `docs_${householdId}`,
 *     () => getHouseholdDocuments(householdId),
 *     { ttl: 60_000 }  // Consider stale after 60s
 *   );
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) {
  const { ttl = 60_000, enabled = true } = options;
  const cached = CACHE.get(key) as CacheEntry<T> | undefined;
  const isStale = !cached || Date.now() - cached.timestamp > ttl;

  const [data, setData] = useState<T | undefined>(cached?.data);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetcherRef.current();
      CACHE.set(key, { data: fresh, timestamp: Date.now() });
      setData(fresh);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!cached || isStale) refresh();
  }, [enabled, key]);

  return { data, loading, error, refresh, isCached: !!cached };
}

/**
 * Invalidate a cache key (e.g. after a mutation).
 */
export function invalidateCache(keyOrPrefix: string, exact = false) {
  if (exact) {
    CACHE.delete(keyOrPrefix);
    return;
  }
  for (const key of CACHE.keys()) {
    if (key.startsWith(keyOrPrefix)) CACHE.delete(key);
  }
}

/**
 * Clear entire cache (e.g. on logout).
 */
export function clearCache() {
  CACHE.clear();
}
