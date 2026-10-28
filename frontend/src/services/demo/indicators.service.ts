import type { Api, Status } from '@/contracts';
import { activeStatuses, statusLabels } from '@/contracts';
import type { DemoContext } from '@/services/demo/context';

export function createDemoIndicatorsService(context: DemoContext): Pick<Api, 'indicators'> {
  const { pause, requireUser, publicCase, matches, cases } = context;
  return {
    async indicators(filters) {
      await pause();
      if (requireUser().perfil !== 'PREFEITURA') throw new Error('Acesso reservado à Prefeitura.');
      const all = cases.filter((c) => publicCase(c) && matches(c, filters));
      const bairros = [...new Set(all.map((c) => c.endereco.bairro))]
        .map((nome) => ({ nome, total: all.filter((c) => c.endereco.bairro === nome).length }))
        .sort((a, b) => b.total - a.total);
      return {
        total: all.length,
        ativos: all.filter((c) => activeStatuses.includes(c.status)).length,
        agendados: all.filter((c) => c.status === 'VISITA_AGENDADA').length,
        resolvidos: all.filter((c) => c.status === 'RESOLVIDO').length,
        bairros,
        status: (Object.keys(statusLabels) as Status[])
          .map((nome) => ({ nome, total: all.filter((c) => c.status === nome).length }))
          .filter((s) => s.total),
      };
    },
  };
}
