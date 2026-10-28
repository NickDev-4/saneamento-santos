import type { CityMapController } from '@/features/map/hooks/useCityMap';
import { LocateFixed, Minus, Plus } from 'lucide-react';

type Props = Pick<CityMapController, 'locate' | 'zoomIn' | 'zoomOut'>;

export function MapControls({ locate, zoomIn, zoomOut }: Props) {
  return (
    <div className="map-controls" role="group" aria-label="Controles do mapa">
      <button type="button" aria-label="Minha localização" onClick={locate}>
        <LocateFixed size={20} />
      </button>
      <button type="button" aria-label="Aumentar zoom" onClick={zoomIn}>
        <Plus size={20} />
      </button>
      <button type="button" aria-label="Diminuir zoom" onClick={zoomOut}>
        <Minus size={20} />
      </button>
    </div>
  );
}
