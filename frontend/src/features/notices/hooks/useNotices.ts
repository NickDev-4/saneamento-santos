import { queryKeys } from '@/app/data/queryKeys';
import { useApi } from '@/app/contexts/api/useApi';
import { useAuth } from '@/app/contexts/auth/useAuth';
import { queryTags } from '@/app/data/queryKeys';
import { useQuery } from '@/app/data/useQuery';
import type { Notice } from '@/contracts';
import { useNoticeActions } from '@/features/notices/context/useNoticeActions';
import { useCallback } from 'react';

export function useNotices() {
  const api = useApi();
  const { user } = useAuth();
  const { markRead } = useNoticeActions();
  const load = useCallback(() => api.notices(), [api]);
  return {
    ...useQuery<Notice[]>(queryKeys.notices, load, queryTags.notices, user?.perfil === 'CIDADAO'),
    markRead,
  };
}
