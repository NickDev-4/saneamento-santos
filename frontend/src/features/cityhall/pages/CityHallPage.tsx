import { CityCaseList } from '@/features/cityhall/components/CityCaseList';
import { DashboardCharts } from '@/features/cityhall/components/DashboardCharts';
import { DashboardFilters } from '@/features/cityhall/components/DashboardFilters';
import { DashboardMetrics } from '@/features/cityhall/components/DashboardMetrics';
import { useCityHallDashboard } from '@/features/cityhall/hooks/useCityHallDashboard';
import { PageTitle } from '@/shared/ui/PageTitle';
import { State } from '@/shared/ui/State';

export function CityHallPage() {
  const {
    navigate,
    filters,
    setFilters,
    mapVisible,
    setMapVisible,
    list,
    metrics,
    update,
    bairros,
    m,
    max,
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
      {metrics.error && <State error={metrics.error} retry={metrics.retry} />}
      <DashboardMetrics m={m} metrics={metrics} />
      <DashboardCharts max={max} m={m} />
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
