import type { Case } from '@/contracts';
import { date } from '@/shared/lib/date';
import { CalendarDays } from 'lucide-react';

export function VisitWindow({
  value,
  compact = false,
}: {
  value: Case['previsaoVisita'];
  compact?: boolean;
}) {
  const hour = (v: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(v));
  return (
    <div className={`visit-window ${compact ? 'visit-compact' : ''}`}>
      <span className="visit-icon">
        <CalendarDays size={19} />
      </span>
      <div>
        <span className="muted small">Previsão de visita</span>
        <strong>
          {value
            ? `${date(value.inicio)} · ${hour(value.inicio)} às ${hour(value.fim)}`
            : 'Sem previsão informada'}
        </strong>
      </div>
    </div>
  );
}
