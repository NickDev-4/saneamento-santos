import { Metric } from '@/features/cityhall/components/Metric';
import type { CityHallController } from '@/features/cityhall/hooks/useCityHallDashboard';
import { CalendarDays, CheckCircle2, ClipboardList, Wrench } from 'lucide-react';

type Props = Pick<CityHallController, 'm' | 'metrics'>;

export function DashboardMetrics({ m, metrics }: Props) {
  return (
    <div className="dashboard-metrics">
      <Metric
        icon={<ClipboardList size={23} />}
        value={metrics.loading ? '—' : (m?.total ?? '—')}
        label="Atendimentos publicados"
        note="Problemas únicos no recorte"
        color="blue"
      />
      <Metric
        icon={<Wrench size={23} />}
        value={metrics.loading ? '—' : (m?.ativos ?? '—')}
        label="Em andamento"
        note="Da análise ao atendimento"
        color="amber"
      />
      <Metric
        icon={<CalendarDays size={23} />}
        value={metrics.loading ? '—' : (m?.agendados ?? '—')}
        label="Visitas agendadas"
        note="Com janela de visita informada"
        color="teal"
      />
      <Metric
        icon={<CheckCircle2 size={23} />}
        value={metrics.loading ? '—' : (m?.resolvidos ?? '—')}
        label="Resolvidos"
        note="Atendimentos concluídos"
        color="green"
      />
    </div>
  );
}
