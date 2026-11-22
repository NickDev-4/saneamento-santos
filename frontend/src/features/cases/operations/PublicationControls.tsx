import type { Case } from '@/contracts';
import type { CaseOperationsController } from '@/features/cases/operations/useCaseOperations';
import { Button } from '@/shared/ui/Button';
import { Eye } from 'lucide-react';

type Props = Pick<CaseOperationsController, 'busy' | 'approvePublication'> & { c: Case };

export function PublicationControls({ c, busy, approvePublication }: Props) {
  return (
    <div className="publication-panel">
      <span className="small muted">Publicação no mapa</span>
      <strong>
        {c.publicacao === 'APROVADO'
          ? 'Relato publicado'
          : c.publicacao === 'PENDENTE'
            ? 'Aguardando validação'
            : 'Publicação não aprovada'}
      </strong>
      {c.publicacao !== 'APROVADO' && (
        <Button variant="secondary" disabled={busy} onClick={approvePublication}>
          <Eye size={16} />
          Aprovar publicação
        </Button>
      )}
    </div>
  );
}
