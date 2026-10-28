import { StatusBadge } from '@/features/cases/components/StatusBadge';
import type { CityHallController } from '@/features/cityhall/hooks/useCityHallDashboard';
import { ArrowDownRight, MapPin } from 'lucide-react';

type Props = Pick<CityHallController, 'max' | 'm'>;

export function DashboardCharts({ max, m }: Props) {
  return (
    <div className="dashboard-charts">
      <section className="content-card chart-card">
        <div className="section-heading">
          <h2>Chamados por bairro</h2>
          <MapPin size={19} />
        </div>
        <p className="muted small">Atendimentos únicos publicados</p>
        <div className="bar-chart">
          {m?.bairros.length ? (
            m.bairros.map((b) => (
              <div className="bar-row" key={b.nome}>
                <span>{b.nome}</span>
                <div>
                  <span style={{ width: `${(b.total / max) * 100}%` }} />
                </div>
                <strong>{b.total}</strong>
              </div>
            ))
          ) : (
            <p className="muted">Sem dados neste recorte.</p>
          )}
        </div>
      </section>
      <section className="content-card chart-card">
        <div className="section-heading">
          <h2>Situação dos atendimentos</h2>
          <ArrowDownRight size={20} />
        </div>
        <div className="status-distribution">
          {m?.status.map((s) => (
            <div key={s.nome}>
              <StatusBadge status={s.nome} />
              <strong>{s.total}</strong>
            </div>
          ))}
        </div>
        <p className="chart-note">
          Relatos vinculados ao mesmo problema contam como um atendimento.
        </p>
      </section>
    </div>
  );
}
