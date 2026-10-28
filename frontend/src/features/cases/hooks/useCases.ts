import { queryKeys } from '@/app/data/queryKeys';
import { useApi } from '@/app/contexts/api/useApi';
import { useAuth } from '@/app/contexts/auth/useAuth';
import { filterKey, queryTags } from '@/app/data/queryKeys';
import { useQuery } from '@/app/data/useQuery';
import type { Case, Filters, Scope } from '@/contracts';
import { useCallback } from 'react';

export function useCases(scope: Scope, filters?: Filters) {
  const api = useApi();
  const { user } = useAuth();
  const key = filterKey(filters);
  const load = useCallback(
    () => api.list(scope, Object.fromEntries(JSON.parse(key))),
    [api, scope, key],
  );
  const enabled =
    scope === 'public' ||
    (scope === 'mine' ? user?.perfil === 'CIDADAO' : user?.perfil === 'SABESP');
  return useQuery<Case[]>(queryKeys.cases(scope, key), load, queryTags.cases, enabled);
}
