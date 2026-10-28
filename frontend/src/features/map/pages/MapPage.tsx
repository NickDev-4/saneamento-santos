import { useMapPage } from '@/features/map/hooks/useMapPage';

import { Plus } from 'lucide-react';

import { Link } from 'react-router-dom';

import { PageTitle } from '@/shared/ui/PageTitle';

import { CityMap } from '@/features/map/components/CityMap';

import { MobileMapSearch } from '@/features/map/components/MobileMapSearch';

import { Layers } from 'lucide-react';

import { StatusBadge } from '@/features/cases/components/StatusBadge';

import { publicStatuses } from '@/features/cases/constants/publicStatuses';

import { MapCaseList } from '@/features/map/components/MapCaseList';

import { CasePreview } from '@/features/map/components/CasePreview';

import { BottomSheet } from '@/features/map/components/BottomSheet';

import { MapPin } from 'lucide-react';

import { MapFiltersDialog } from '@/features/map/components/MapFiltersDialog';

export function MapPage() {
  const {
    data,
    loading,
    error,
    retry,
    setParams,
    selectedId,
    setSelectedId,
    filtersOpen,
    setFiltersOpen,
    expanded,
    setExpanded,
    legend,
    setLegend,
    search,
    status,
    bairro,
    update,
    filtered,
    selected,
  } = useMapPage();
  return (
    <div className="map-page">
      <h1 className="sr-only mobile-map-title">Mapa de ocorrências</h1>
      <PageTitle
        eyebrow="CUIDAR DA CIDADE COMEÇA POR AQUI"
        title="Mapa de ocorrências"
        description="Veja os problemas relatados e acompanhe cada atendimento."
        action={
          <Link className="button button-primary desktop-register" to="/registrar">
            <Plus size={18} />
            Registrar problema
          </Link>
        }
      />
      <section
        className={`map-workspace ${expanded ? 'sheet-expanded' : ''}`}
        aria-label="Consulta de ocorrências"
      >
        <CityMap
          cases={filtered}
          selected={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setExpanded(true);
          }}
        />
        <MobileMapSearch
          value={search}
          onChange={(v) => update('q', v)}
          onFilter={() => setFiltersOpen(true)}
        />
        <button
          className="map-legend-toggle"
          onClick={() => setLegend(!legend)}
          aria-expanded={legend}
        >
          <Layers size={16} />
          <span>Legenda</span>
        </button>
        {legend && (
          <div className="map-legend">
            {publicStatuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        )}
        <BottomSheet expanded={expanded} onExpandedChange={setExpanded}>
          {selected ? (
            <CasePreview item={selected} onClose={() => setSelectedId(undefined)} />
          ) : (
            <MapCaseList
              search={search}
              update={update}
              filtered={filtered}
              setFiltersOpen={setFiltersOpen}
              expanded={expanded}
              setExpanded={setExpanded}
              status={status}
              bairro={bairro}
              setParams={setParams}
              setSelectedId={setSelectedId}
              loading={loading}
              error={error}
              retry={retry}
            />
          )}
        </BottomSheet>
        <div className="map-caption">
          <MapPin size={14} />
          Santos · São Paulo
        </div>
      </section>
      {filtersOpen && (
        <MapFiltersDialog
          data={data}
          bairro={bairro}
          update={update}
          status={status}
          setParams={setParams}
          setFiltersOpen={setFiltersOpen}
        />
      )}
    </div>
  );
}
