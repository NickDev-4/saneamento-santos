import { useCases } from '@/features/cases/hooks/useCases';
import { useState } from 'react';

export function useMyCases() {
  const { data, loading, error, retry } = useCases('mine');
  const [filter, setFilter] = useState('');
  const list = (data || []).filter(
    (c) =>
      !filter ||
      (filter === 'active'
        ? ['RECEBIDO', 'EM_ANALISE', 'VISITA_AGENDADA', 'EM_ATENDIMENTO'].includes(c.status)
        : c.status === filter),
  );
  return { loading, error, retry, filter, setFilter, list };
}

export type MyCasesPageController = ReturnType<typeof useMyCases>;
