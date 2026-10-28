import { MapControls } from '@/features/map/components/MapControls';
import { useCityMap } from '@/features/map/hooks/useCityMap';
import type { CityMapProps } from '@/features/map/types';

export function CityMap({
  cases = [],
  selected,
  onSelect,
  value,
  onChange,
  compact = false,
}: CityMapProps) {
  const { host, failed, locate, zoomIn, zoomOut } = useCityMap({
    cases,
    selected,
    onSelect,
    value,
    onChange,
    compact,
  });
  return (
    <div className={`city-map ${compact ? 'map-compact' : ''}`}>
      <div
        className="leaflet-host"
        ref={host}
        role="region"
        aria-label={
          onChange ? 'Mapa para ajustar o local do problema' : 'Mapa de ocorrências em Santos'
        }
      />
      <MapControls locate={locate} zoomIn={zoomIn} zoomOut={zoomOut} />
      {failed && (
        <div className="map-offline" role="status">
          Mapa indisponível. Consulte os chamados na lista.
        </div>
      )}
    </div>
  );
}
