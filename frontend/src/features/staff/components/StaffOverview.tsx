import type { StaffQueueController } from '@/features/staff/hooks/useStaffQueue';
import { CalendarDays, ClipboardList, Wrench } from 'lucide-react';

type Props = Pick<StaffQueueController, 'data'>;

export function StaffOverview({ data }: Props) {
  return (
    <div className="staff-overview">
      <div>
        <span className="metric-icon metric-blue">
          <ClipboardList size={22} />
        </span>
        <div>
          <strong>{data?.filter((c) => c.status === 'RECEBIDO').length ?? '—'}</strong>
          <span>Aguardando análise</span>
        </div>
      </div>
      <div>
        <span className="metric-icon metric-amber">
          <CalendarDays size={22} />
        </span>
        <div>
          <strong>{data?.filter((c) => c.status === 'VISITA_AGENDADA').length ?? '—'}</strong>
          <span>Visitas agendadas</span>
        </div>
      </div>
      <div>
        <span className="metric-icon metric-teal">
          <Wrench size={22} />
        </span>
        <div>
          <strong>{data?.filter((c) => c.status === 'EM_ATENDIMENTO').length ?? '—'}</strong>
          <span>Em atendimento</span>
        </div>
      </div>
    </div>
  );
}
