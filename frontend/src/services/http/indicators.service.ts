import type { Api } from '@/contracts';
import type { HttpClient } from '@/services/http/client';
import { query } from '@/services/http/query';

export function createIndicatorsService({ request }: HttpClient): Pick<Api, 'indicators'> {
  const service: Pick<Api, 'indicators'> = {
    async indicators(filters) {
      const response = await request<{
        totalAtendimentos: number;
        totalAtivos: number;
        totalResolvidos: number;
        porStatus: { status: import('@/contracts').Status; quantidade: number }[];
        porBairro: { nome: string; quantidade: number }[];
      }>(`/prefeitura/indicadores?${query(filters)}`);
      return {
        total: response.totalAtendimentos,
        ativos: response.totalAtivos,
        agendados:
          response.porStatus.find((item) => item.status === 'VISITA_AGENDADA')?.quantidade ?? 0,
        resolvidos: response.totalResolvidos,
        bairros: response.porBairro.map(({ nome, quantidade }) => ({ nome, total: quantidade })),
        status: response.porStatus.map(({ status, quantidade }) => ({
          nome: status,
          total: quantidade,
        })),
      };
    },
  };
  return service;
}
