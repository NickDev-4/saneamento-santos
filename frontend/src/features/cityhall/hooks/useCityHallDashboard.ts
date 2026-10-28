import type { Filters } from '@/contracts';
import { useCases } from '@/features/cases/hooks/useCases';
import { useIndicators } from '@/features/cityhall/hooks/useIndicators';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function useCityHallDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [mapVisible, setMapVisible] = useState(false);
  const list = useCases('public', filters);
  const all = useCases('public');
  const metrics = useIndicators(filters);
  function update(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  const bairros = [...new Set((all.data || []).map((c) => c.endereco.bairro))].sort();
  const m = metrics.data;
  const max = Math.max(1, ...(m?.bairros.map((b) => b.total) || []));
  return {
    navigate,
    filters,
    setFilters,
    mapVisible,
    setMapVisible,
    list,
    metrics,
    update,
    bairros,
    m,
    max,
  };
}

export type CityHallController = ReturnType<typeof useCityHallDashboard>;
