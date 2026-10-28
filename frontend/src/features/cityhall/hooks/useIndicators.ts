import { queryKeys } from '@/app/data/queryKeys';
import { useApi } from '@/app/contexts/api/useApi';
import { useAuth } from '@/app/contexts/auth/useAuth';
import { filterKey, queryTags } from '@/app/data/queryKeys';
import { useQuery } from '@/app/data/useQuery';
import type { Filters, Indicators } from '@/contracts';
import { useCallback } from 'react';

export function useIndicators(filters?: Filters) {
  const api = useApi();
  const { user } = useAuth();
  const key = filterKey(filters);
  const load = useCallback(() => api.indicators(Object.fromEntries(JSON.parse(key))), [api, key]);
  return useQuery<Indicators>(
    queryKeys.indicators(key),
    load,
    queryTags.indicators,
    user?.perfil === 'PREFEITURA',
  );
}
