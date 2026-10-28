import type { Api } from '@/contracts';
import type { HttpClient } from '@/services/http/client';
import { query } from '@/services/http/query';

export function createIndicatorsService({ request }: HttpClient): Pick<Api, 'indicators'> {
  const service: Pick<Api, 'indicators'> = {
    indicators: (filters) => request(`/prefeitura/indicadores?${query(filters)}`),
  };
  return service;
}
