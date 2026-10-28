import type { Case } from '@/contracts';
import { StatusBadge } from '@/features/cases/components/StatusBadge';
import { address } from '@/features/cases/lib/address';
import { MapPin } from 'lucide-react';

type Props = {} & { c: Case };

export function CaseHeading({ c }: Props) {
  return (
    <div className="detail-page-heading">
      <div>
        <span className="eyebrow">{c.protocolo}</span>
        <h1>{c.tipo}</h1>
        <p>
          <MapPin size={16} />
          {address(c)} · {c.endereco.bairro}
        </p>
      </div>
      <StatusBadge status={c.status} />
    </div>
  );
}
