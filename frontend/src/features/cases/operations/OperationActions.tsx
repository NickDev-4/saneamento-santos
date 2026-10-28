import type { Case } from '@/contracts';
import { PublicationControls } from '@/features/cases/operations/PublicationControls';
import type { CaseOperationsController } from '@/features/cases/operations/useCaseOperations';
import { Button } from '@/shared/ui/Button';
import { CalendarDays, CheckCircle2, Link2, ShieldCheck, Wrench } from 'lucide-react';

type Props = Pick<
  CaseOperationsController,
  'can' | 'busy' | 'updateStatus' | 'open' | 'approvePublication'
> & { c: Case };

export function OperationActions({ can, busy, updateStatus, c, open, approvePublication }: Props) {
  return (
    <div className="operation-actions">
      {can('analisar') && (
        <Button disabled={busy} onClick={() => updateStatus('EM_ANALISE')}>
          <ShieldCheck size={17} />
          Iniciar análise
        </Button>
      )}
      {can('agendar') && (
        <Button disabled={busy} onClick={() => open('agendar')}>
          <CalendarDays size={17} />
          {c.previsaoVisita ? 'Alterar agendamento' : 'Agendar visita'}
        </Button>
      )}
      {can('iniciar') && (
        <Button disabled={busy} onClick={() => updateStatus('EM_ATENDIMENTO')}>
          <Wrench size={17} />
          Iniciar atendimento
        </Button>
      )}
      {can('resolver') && (
        <Button disabled={busy} onClick={() => open('resolver')}>
          <CheckCircle2 size={17} />
          Concluir atendimento
        </Button>
      )}
      {can('publicar') && (
        <PublicationControls
          c={c}
          busy={busy}
          approvePublication={approvePublication}

          open={open}
        />
      )}
      {can('vincular') && (
        <Button variant="secondary" onClick={() => open('vincular')}>
          <Link2 size={16} />
          Vincular duplicata
        </Button>
      )}
      {can('encerrar') && (
        <button className="text-link danger-text" onClick={() => open('encerrar')}>
          Encerrar sem atendimento
        </button>
      )}
    </div>
  );
}
