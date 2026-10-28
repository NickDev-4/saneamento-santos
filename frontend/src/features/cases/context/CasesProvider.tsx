import type { CaseActions } from './CasesContext';
import { CasesContext } from './CasesContext';
import { useApi } from '@/app/contexts/api/useApi';
import { useSession } from '@/app/contexts/auth/useSession';
import { queryTags } from '@/app/data/queryKeys';
import { useQueryClient } from '@/app/data/useQueryClient';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export function CasesProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { execute } = useSession();
  const cache = useQueryClient();
  const actions = useMemo<CaseActions>(() => {
    async function change<T>(work: () => Promise<T>) {
      const result = await execute(work);
      cache.invalidate(queryTags.caseMutation);
      return result;
    }
    return {
      save: (input, id) => change(() => api.save(input, id)),
      cancel: (id) => change(() => api.cancel(id)),
      transition: (id, status, texto, foto) =>
        change(() => api.transition(id, status, texto, foto)),
      publish: (id, approved, motivo) => change(() => api.publish(id, approved, motivo)),
      schedule: (id, inicio, fim) => change(() => api.schedule(id, inicio, fim)),
      link: (id, principalId, motivo) => change(() => api.link(id, principalId, motivo)),
      comment: (id, texto, internal) => change(() => api.comment(id, texto, internal)),
    };
  }, [api, execute, cache]);
  return <CasesContext value={actions}>{children}</CasesContext>;
}
