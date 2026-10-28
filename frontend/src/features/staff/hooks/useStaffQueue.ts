import { useCases } from '@/features/cases/hooks/useCases';
import { address } from '@/features/cases/lib/address';
import { useState } from 'react';

export function useStaffQueue() {
  const { data, loading, error, retry } = useCases('staff');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [publication, setPublication] = useState('');
  const list = (data || []).filter(
    (c) =>
      (!status || c.status === status) &&
      (!publication || c.publicacao === publication) &&
      `${c.protocolo} ${c.tipo} ${address(c)} ${c.endereco.bairro}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return {
    data,
    loading,
    error,
    retry,
    query,
    setQuery,
    status,
    setStatus,
    publication,
    setPublication,
    list,
  };
}

export type StaffQueueController = ReturnType<typeof useStaffQueue>;
