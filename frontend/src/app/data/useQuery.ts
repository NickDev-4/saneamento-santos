import { useSession } from '@/app/contexts/auth/useSession';
import type { QueryState } from '@/app/data/query-cache';
import { useQueryClient } from '@/app/data/useQueryClient';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

const idle: QueryState<never> = { data: null, loading: false, error: '', failure: null };

export function useQuery<T>(
  key: string,
  load: () => Promise<T>,
  tags: readonly string[],
  enabled = true,
) {
  const cache = useQueryClient();
  const { execute, ready } = useSession();
  const active = ready && enabled;
  const subscribe = useCallback(
    (listener: () => void) => (active ? cache.subscribe(key, listener) : () => {}),
    [cache, key, active],
  );
  const snapshot = useCallback(
    () => (active ? cache.snapshot<T>(key) : (idle as QueryState<T>)),
    [cache, key, active],
  );
  const state = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => {
    if (active) void cache.fetch(key, () => execute(load), tags);
  }, [cache, key, active, execute, load, tags]);
  const retry = useCallback(() => {
    if (active) cache.retry(key);
  }, [cache, key, active]);
  return { ...state, loading: !ready || state.loading, retry };
}
