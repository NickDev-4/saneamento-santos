import { CityCaseList } from '@/features/cityhall/components/CityCaseList';
import { DashboardFilters } from '@/features/cityhall/components/DashboardFilters';
import { useCityHallDashboard } from '@/features/cityhall/hooks/useCityHallDashboard';
import { PageTitle } from '@/shared/ui/PageTitle';

export function CityHallPage() {
  const {
    navigate,
    filters,
    setFilters,
    mapVisible,
    setMapVisible,
    list,
    update,
    bairros,
  } = useCityHallDashboard();
  return (
    <div className="page-container institution-page">
      <PageTitle
        eyebrow="ÁREA PREFEITURA"
        title="Um panorama do saneamento"
        description="Acompanhe os atendimentos publicados e os bairros da cidade."
      />
      <DashboardFilters
        bairros={bairros}
        filters={filters}
        update={update}
        setFilters={setFilters}
      />
      <CityCaseList
        mapVisible={mapVisible}
        setMapVisible={setMapVisible}
        list={list}
        navigate={navigate}
      />
      <p className="page-footnote">
        Acompanhamento dos dados públicos. Contatos dos autores e observações internas ficam
        restritos à operação.
      </p>
    </div>
  );
}
