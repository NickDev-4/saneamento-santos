import { CityMap } from '@/features/map/components/CityMap';
import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { Field } from '@/shared/ui/Field';
import { Navigation } from 'lucide-react';

type Props = Pick<ReportFormController, 'location' | 'setLocation' | 'errors'>;

export function ReportLocationPicker({ location, setLocation, errors }: Props) {
  return (
    <div className="location-picker">
      <div className="location-picker-title">
        <Navigation size={17} />
        <strong>Confirme o ponto no mapa</strong>
      </div>
      <p>Toque no local ou arraste o marcador.</p>
      <CityMap compact value={location} onChange={setLocation} />
      <details>
        <summary>Ajustar pelas coordenadas</summary>
        <div className="form-columns">
          <Field label="Latitude" htmlFor="latitude">
            <input
              id="latitude"
              type="number"
              step="0.000001"
              value={location.latitude}
              onChange={(e) => setLocation((l) => ({ ...l, latitude: e.target.valueAsNumber }))}
            />
          </Field>
          <Field label="Longitude" htmlFor="longitude">
            <input
              id="longitude"
              type="number"
              step="0.000001"
              value={location.longitude}
              onChange={(e) => setLocation((l) => ({ ...l, longitude: e.target.valueAsNumber }))}
            />
          </Field>
        </div>
      </details>
      {errors.localizacao && (
        <p className="inline-error" role="alert">
          {errors.localizacao}
        </p>
      )}
    </div>
  );
}
