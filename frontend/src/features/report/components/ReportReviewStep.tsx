import { CityMap } from '@/features/map/components/CityMap';
import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { date } from '@/shared/lib/date';
import { CheckCircle2, MapPin } from 'lucide-react';

type Props = Pick<
  ReportFormController,
  | 'setStep'
  | 'endereco'
  | 'location'
  | 'typeName'
  | 'descricao'
  | 'observadoEm'
  | 'kept'
  | 'previews'
>;

export function ReportReviewStep({
  setStep,
  endereco,
  location,
  typeName,
  descricao,
  observadoEm,
  kept,
  previews,
}: Props) {
  return (
    <div className="review-content">
      <div className="review-section">
        <div className="review-heading">
          <h3>
            <MapPin size={18} />
            Local do problema
          </h3>
          <button type="button" onClick={() => setStep(0)}>
            Editar
          </button>
        </div>
        <strong>
          {endereco.logradouro}, {endereco.semNumero ? 's/n' : endereco.numero}
        </strong>
        <p>
          {endereco.bairro} · Santos, SP · {endereco.cep}
        </p>
        {endereco.referencia && <p>{endereco.referencia}</p>}
        <CityMap compact value={location} />
      </div>
      <div className="review-section">
        <div className="review-heading">
          <h3>Sobre o problema</h3>
          <button type="button" onClick={() => setStep(1)}>
            Editar
          </button>
        </div>
        <strong>{typeName}</strong>
        <p className="preserve-lines">{descricao}</p>
        <small>Observado em {date(new Date(observadoEm).toISOString(), true)}</small>
        <div className="photo-previews">
          {[...kept.map((i) => i.url), ...previews].map((url, i) => (
            <div key={url}>
              <img src={url} alt={`Foto do relato ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="info-banner">
        <CheckCircle2 size={21} />
        <p>
          Seu relato será analisado antes de aparecer no mapa. Você poderá acompanhá-lo
          imediatamente na sua conta.
        </p>
      </div>
    </div>
  );
}
