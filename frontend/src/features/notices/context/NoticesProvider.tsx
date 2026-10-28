import { NoticesContext } from './NoticesContext';
import { useApi } from '@/app/contexts/api/useApi';
import { useSession } from '@/app/contexts/auth/useSession';
import { queryTags } from '@/app/data/queryKeys';
import { useQueryClient } from '@/app/data/useQueryClient';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export function NoticesProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { execute } = useSession();
  const cache = useQueryClient();
  const value = useMemo(
    () => ({
      async markRead(id: string) {
        await execute(() => api.markRead(id));
        cache.invalidate(queryTags.notices);
      },
    }),
    [api, execute, cache],
  );
  return <NoticesContext value={value}>{children}</NoticesContext>;
}
