import { QueryCache } from './query-cache';
import { QueryContext } from './QueryContext';
import { useApi } from '@/app/contexts/api/useApi';
import { useSession } from '@/app/contexts/auth/useSession';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { sessionVersion } = useSession();
  const cache = useMemo(() => new QueryCache(), [api, sessionVersion]);
  return <QueryContext value={cache}>{children}</QueryContext>;
}
