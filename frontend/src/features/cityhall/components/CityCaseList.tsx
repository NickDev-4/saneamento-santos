import { CaseTable } from '@/features/cases/components/CaseTable';
import type { CityHallController } from '@/features/cityhall/hooks/useCityHallDashboard';
import { CityMap } from '@/features/map/components/CityMap';
import { Button } from '@/shared/ui/Button';
import { State } from '@/shared/ui/State';
import { Map } from 'lucide-react';

type Props = Pick<CityHallController, 'mapVisible' | 'setMapVisible' | 'list' | 'navigate'>;

export function CityCaseList({ mapVisible, setMapVisible, list, navigate }: Props) {
  return (
    <section className="content-card institution-list">
      <div className="institution-list-heading">
        <div>
          <h2>Atendimentos da cidade</h2>
          <p>Os filtros acima se aplicam à lista e aos indicadores.</p>
        </div>
        <Button variant="secondary" onClick={() => setMapVisible(!mapVisible)}>
          <Map size={17} />
          {mapVisible ? 'Ocultar mapa' : 'Ver no mapa'}
        </Button>
      </div>
      {mapVisible && (
        <div className="dashboard-map">
          <CityMap
            cases={list.data || []}
            onSelect={(id) => {
              navigate(`/chamados/${id}`);
            }}
          />
        </div>
      )}
      {list.loading || list.error ? (
        <State loading={list.loading} error={list.error} retry={list.retry} />
      ) : list.data?.length ? (
        <CaseTable cases={list.data} />
      ) : (
        <State
          title="Nenhum atendimento neste recorte"
          text="Ajuste o período, bairro ou status para consultar outros resultados."
        />
      )}
    </section>
  );
}
