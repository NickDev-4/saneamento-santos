import type { Case } from '@/contracts';
import { ShieldCheck } from 'lucide-react';

type Props = {} & { c: Case };

export function CasePublicationBanner({ c }: Props) {
  return (
    <div className="info-banner">
      <ShieldCheck size={23} />
      <p>
        <strong>
          {c.publicacao === 'PENDENTE'
            ? 'Este relato aguarda validação'
            : 'Este relato não está publicado'}
        </strong>
        <span>O registro está disponível ao autor e à equipe responsável.</span>
      </p>
    </div>
  );
}
