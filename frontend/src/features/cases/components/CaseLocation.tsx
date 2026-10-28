import type { Case } from '@/contracts';
import { VisitWindow } from '@/features/cases/components/VisitWindow';
import { address } from '@/features/cases/lib/address';
import { CityMap } from '@/features/map/components/CityMap';
import { MapPin } from 'lucide-react';

type Props = {} & { c: Case };

export function CaseLocation({ c }: Props) {
  return (
    <section className="content-card detail-location">
      <VisitWindow value={c.previsaoVisita} />
      <div className="detail-mini-map">
        <CityMap value={c.localizacao} compact />
      </div>
      <div className="section-content">
        <h3>
          <MapPin size={17} />
          Local da ocorrência
        </h3>
        <strong>{address(c)}</strong>
        <p>{c.endereco.bairro} · Santos, SP</p>
        {c.endereco.referencia && <small>{c.endereco.referencia}</small>}
      </div>
    </section>
  );
}
