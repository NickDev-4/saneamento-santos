import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { Button } from '@/shared/ui/Button';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = Pick<ReportFormController, 'setStep' | 'step' | 'id' | 'busy'>;

export function ReportNavigation({ setStep, step, id, busy }: Props) {
  return (
    <div className="form-navigation">
      {step > 0 ? (
        <Button variant="ghost" type="button" onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft size={17} />
          Voltar
        </Button>
      ) : (
        <Link className="button button-ghost" to="/">
          Cancelar
        </Link>
      )}
      <Button type="submit" disabled={busy}>
        {busy
          ? 'Enviando…'
          : step === 2
            ? id
              ? 'Salvar alterações'
              : 'Enviar relato'
            : 'Continuar'}
        {step === 2 ? <Send size={17} /> : <ArrowRight size={17} />}
      </Button>
    </div>
  );
}
