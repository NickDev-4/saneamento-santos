import { queryKeys } from '@/app/data/queryKeys';
import { useApi } from '@/app/contexts/api/useApi';
import { queryTags } from '@/app/data/queryKeys';
import { useQuery } from '@/app/data/useQuery';
import { useCallback } from 'react';

export function useCaseTypes() {
  const api = useApi();
  const load = useCallback(() => api.types(), [api]);
  return useQuery(queryKeys.types, load, queryTags.catalogue);
}
