import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { Check, MapPin } from 'lucide-react';

type Props = Pick<ReportFormController, 'step'>;

export function ReportSteps({ step }: Props) {
  return (
    <aside className="report-aside">
      <ol className="step-list">
        {['Onde aconteceu', 'O que aconteceu', 'Revisar e enviar'].map((s, i) => (
          <li key={s} className={step === i ? 'current' : step > i ? 'done' : ''}>
            <span>{step > i ? <Check size={18} /> : i + 1}</span>
            <div>
              <strong>{s}</strong>
              <small>
                {['Endereço e ponto no mapa', 'Descrição, data e fotos', 'Confira seu relato'][i]}
              </small>
            </div>
          </li>
        ))}
      </ol>
      <div className="report-tip">
        <span className="section-icon">
          <MapPin size={22} />
        </span>
        <h3>O ponto certo faz diferença</h3>
        <p>Informe o local do problema. Ele pode ser diferente do endereço onde você mora.</p>
      </div>
    </aside>
  );
}
