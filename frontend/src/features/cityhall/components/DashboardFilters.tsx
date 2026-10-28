import type { Status } from '@/contracts';
import { statusLabels } from '@/contracts';
import type { CityHallController } from '@/features/cityhall/hooks/useCityHallDashboard';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Filter } from 'lucide-react';

type Props = Pick<CityHallController, 'bairros' | 'filters' | 'update' | 'setFilters'>;

export function DashboardFilters({ bairros, filters, update, setFilters }: Props) {
  return (
    <section className="content-card dashboard-filters">
      <div>
        <Filter size={18} />
        <strong>Filtrar acompanhamento</strong>
      </div>
      <div className="dashboard-filter-fields">
        <Field label="Bairro" htmlFor="gestao-bairro">
          <select
            id="gestao-bairro"
            value={filters.bairro || ''}
            onChange={(e) => update('bairro', e.target.value)}
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="gestao-status">
          <select
            id="gestao-status"
            value={filters.status || ''}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">Todos os status</option>
            {(
              [
                'EM_ANALISE',
                'VISITA_AGENDADA',
                'EM_ATENDIMENTO',
                'RESOLVIDO',
                'ENCERRADO_SEM_ATENDIMENTO',
              ] as Status[]
            ).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Criado a partir de" htmlFor="gestao-de">
          <input
            id="gestao-de"
            type="date"
            value={filters.criadoDe || ''}
            max={filters.criadoAte}
            onChange={(e) => update('criadoDe', e.target.value)}
          />
        </Field>
        <Field label="Criado até" htmlFor="gestao-ate">
          <input
            id="gestao-ate"
            type="date"
            value={filters.criadoAte || ''}
            min={filters.criadoDe}
            onChange={(e) => update('criadoAte', e.target.value)}
          />
        </Field>
        <Button variant="ghost" onClick={() => setFilters({})}>
          Limpar
        </Button>
      </div>
    </section>
  );
}
