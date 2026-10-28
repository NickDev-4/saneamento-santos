import { useCases } from '@/features/cases/hooks/useCases';
import { address } from '@/features/cases/lib/address';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function useMapPage() {
  const { data, loading, error, retry } = useCases('public');
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [legend, setLegend] = useState(false);
  const search = params.get('q') || '';
  const status = params.get('status') || '';
  const bairro = params.get('bairro') || '';
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
    setSelectedId(undefined);
  }
  const filtered = (data || []).filter(
    (c) =>
      (!status || c.status === status) &&
      (!bairro || c.endereco.bairro === bairro) &&
      normalize(`${address(c)} ${c.endereco.bairro} ${c.protocolo} ${c.tipo}`).includes(
        normalize(search),
      ),
  );
  const selected = filtered.find((c) => c.id === selectedId);
  return {
    data,
    loading,
    error,
    retry,
    setParams,
    selectedId,
    setSelectedId,
    filtersOpen,
    setFiltersOpen,
    expanded,
    setExpanded,
    legend,
    setLegend,
    search,
    status,
    bairro,
    update,
    filtered,
    selected,
  };
}

export type MapController = ReturnType<typeof useMapPage>;
