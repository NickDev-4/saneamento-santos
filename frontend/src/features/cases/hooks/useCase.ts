import { queryKeys } from '@/app/data/queryKeys';
import { useApi } from '@/app/contexts/api/useApi';
import { useAuth } from '@/app/contexts/auth/useAuth';
import { queryTags } from '@/app/data/queryKeys';
import { useQuery } from '@/app/data/useQuery';
import type { Case, Scope } from '@/contracts';
import { useCallback } from 'react';

export function useCase(id: string | undefined, scope: Scope) {
  const api = useApi();
  const { user } = useAuth();
  const load = useCallback(() => api.detail(id!, scope), [api, id, scope]);
  const enabled =
    Boolean(id) &&
    (scope === 'public' || (scope === 'staff' ? user?.perfil === 'SABESP' : Boolean(user)));
  return useQuery<Case>(queryKeys.case(scope, id), load, queryTags.cases, enabled);
}
