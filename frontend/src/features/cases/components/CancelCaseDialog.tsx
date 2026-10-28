import type { CaseDetailController } from '@/features/cases/hooks/useCaseDetailPage';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

type Props = Pick<CaseDetailController, 'setCancelOpen' | 'busy' | 'cancel'>;

export function CancelCaseDialog({ setCancelOpen, busy, cancel }: Props) {
  return (
    <Dialog title="Cancelar este chamado?" onClose={() => setCancelOpen(false)}>
      <p>O registro ficará no seu histórico como cancelado e deixará a fila de análise.</p>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={() => setCancelOpen(false)}>
          Manter chamado
        </Button>
        <Button variant="danger" disabled={busy} onClick={cancel}>
          {busy ? 'Cancelando…' : 'Confirmar cancelamento'}
        </Button>
      </div>
    </Dialog>
  );
}
