import type { Case } from '@/contracts';
import { StatusBadge } from '@/features/cases/components/StatusBadge';
import { address } from '@/features/cases/lib/address';
import { date } from '@/shared/lib/date';
import { ChevronRight, Droplets, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CaseCard({
  item,
  to,
  onSelect,
  selected = false,
}: {
  item: Case;
  to?: string;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const content = (
    <>
      <span className={`case-card-icon pin-${item.status.toLowerCase()}`}>
        <Droplets size={20} />
      </span>
      <span className="case-card-body">
        <span className="case-card-top">
          <small>{item.protocolo}</small>
          <StatusBadge status={item.status} />
        </span>
        <strong>{address(item)}</strong>
        <span className="case-type">{item.tipo}</span>
        <span className="case-meta">
          <MapPin size={13} />
          {item.endereco.bairro}
          <span>·</span>
          {date(item.criadoEm)}
        </span>
      </span>
      <ChevronRight className="case-chevron" size={18} />
    </>
  );
  return to ? (
    <Link className={`case-card ${selected ? 'selected' : ''}`} to={to}>
      {content}
    </Link>
  ) : (
    <button className={`case-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      {content}
    </button>
  );
}
