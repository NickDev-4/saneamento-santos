import type { Case } from '@/contracts';
import { StatusBadge } from '@/features/cases/components/StatusBadge';
import { VisitWindow } from '@/features/cases/components/VisitWindow';
import { address } from '@/features/cases/lib/address';
import { ArrowRight, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CasePreview({ item, onClose }: { item: Case; onClose: () => void }) {
  return (
    <div className="case-preview">
      <div className="preview-heading" data-sheet-drag-area>
        <span className="eyebrow">DETALHES DO CHAMADO</span>
        <button className="icon-button" aria-label="Voltar à lista" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <div className="preview-image">
        <img
          src={item.imagens[0]?.url || '/cenario-esgoto.svg'}
          alt={
            item.imagens[0]?.ilustrativa
              ? 'Ilustração do cenário fictício de esgoto'
              : 'Foto do problema relatado'
          }
        />
      </div>
      <div className="preview-body">
        <div className="case-card-top">
          <small>{item.protocolo}</small>
          <StatusBadge status={item.status} />
        </div>
        <h2>{address(item)}</h2>
        <p className="location-line">
          <MapPin size={14} />
          {item.endereco.bairro} · Santos
        </p>
        <h3>{item.tipo}</h3>
        <p className="preview-description">{item.descricao}</p>
        <VisitWindow value={item.previsaoVisita} />
        <Link className="button button-primary button-full" to={`/chamados/${item.id}`}>
          Ver chamado completo
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}
