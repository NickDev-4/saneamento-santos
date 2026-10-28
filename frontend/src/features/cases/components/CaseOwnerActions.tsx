import type { Case } from '@/contracts';
import type { CaseDetailController } from '@/features/cases/hooks/useCaseDetailPage';
import { Button } from '@/shared/ui/Button';
import { Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = Pick<CaseDetailController, 'setCancelOpen'> & { c: Case };

export function CaseOwnerActions({ c, setCancelOpen }: Props) {
  return (
    <section className="content-card owner-actions">
      <p>Você pode alterar seu relato enquanto a análise não começa.</p>
      <Link className="button button-secondary button-full" to={`/chamados/${c.id}/editar`}>
        <Pencil size={16} />
        Editar registro
      </Link>
      <Button className="button-full" variant="ghost" onClick={() => setCancelOpen(true)}>
        <X size={16} />
        Cancelar chamado
      </Button>
    </section>
  );
}
