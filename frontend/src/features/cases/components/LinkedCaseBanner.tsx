import type { Case } from '@/contracts';
import { StatusBadge } from '@/features/cases/components/StatusBadge';
import { VisitWindow } from '@/features/cases/components/VisitWindow';
import { ArrowRight, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {} & { c: Case };

export function LinkedCaseBanner({ c }: Props) {
  if (!c.vinculo) return null;
  return (
    <div className="linked-banner">
      <Link2 size={24} />
      <div>
        <strong>Seu relato acompanha um atendimento existente</strong>
        <p>
          O mesmo problema já é acompanhado pelo chamado <b>{c.vinculo.protocolo}</b>. Seu envio
          permanece no histórico.
        </p>
        <div className="linked-status">
          <StatusBadge status={c.vinculo.status} />
          <Link to={`/chamados/${c.vinculo.id}`}>
            Ver atendimento principal
            <ArrowRight size={15} />
          </Link>
        </div>
        <VisitWindow value={c.vinculo.previsaoVisita} compact />
      </div>
    </div>
  );
}
