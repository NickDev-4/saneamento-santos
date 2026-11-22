import type { Filters } from '@/contracts';
import { useCases } from '@/features/cases/hooks/useCases';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function useCityHallDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [mapVisible, setMapVisible] = useState(false);
  const list = useCases('public', filters);
  const all = useCases('public');
  function update(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  const bairros = [...new Set((all.data || []).map((c) => c.endereco.bairro))].sort();
  return {
    navigate,
    filters,
    setFilters,
    mapVisible,
    setMapVisible,
    list,
    update,
    bairros,
  };
}

export type CityHallController = ReturnType<typeof useCityHallDashboard>;
