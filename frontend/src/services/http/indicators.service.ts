import type { Api, Indicators, Status } from '@/contracts';
import type { HttpClient } from '@/services/http/client';
import { query } from '@/services/http/query';

interface IndicatorsResponse {
  totalAtendimentos: number;
  totalAtivos: number;
  totalResolvidos: number;
  porStatus: { status: Status; quantidade: number }[];
  porBairro: { nome: string; quantidade: number }[];
}

export function createIndicatorsService({ request }: HttpClient): Pick<Api, 'indicators'> {
  const service: Pick<Api, 'indicators'> = {
    async indicators(filters): Promise<Indicators> {
      const response = await request<IndicatorsResponse>(
        `/prefeitura/indicadores?${query(filters)}`,
      );
      const status = response.porStatus.map(({ status, quantidade }) => ({
        nome: status,
        total: quantidade,
      }));
      return {
        total: response.totalAtendimentos,
        ativos: response.totalAtivos,
        agendados:
          response.porStatus.find((item) => item.status === 'VISITA_AGENDADA')?.quantidade ?? 0,
        resolvidos: response.totalResolvidos,
        bairros: response.porBairro.map(({ nome, quantidade }) => ({ nome, total: quantidade })),
        status,
      };
    },
  };
  return service;
}
