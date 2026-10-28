import type { Case } from '@/contracts';
import type { ReportFormController } from '@/features/report/hooks/useReportForm';
import { isDemo } from '@/config/environment';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = Pick<ReportFormController, 'id'> & { created: Case };

export function ReportConfirmation({ id, created }: Props) {
  return (
    <div className="page-container narrow-page">
      <div className="confirmation-card">
        <span className="success-icon">
          <CheckCircle2 size={38} />
        </span>
        <span className="eyebrow">
          {id ? 'ALTERAÇÕES SALVAS' : 'OBRIGADO POR CUIDAR DA CIDADE'}
        </span>
        <h1>{id ? 'Seu registro foi atualizado' : 'Recebemos seu relato!'}</h1>
        <p>
          Seu registro aguarda a validação da equipe. Você pode acompanhar cada atualização em Meus
          chamados.
        </p>
        <div className="protocol-box">
          <span>Seu protocolo{isDemo ? ' de demonstração' : ''}</span>
          <strong>{created.protocolo}</strong>
        </div>
        <Link className="button button-primary button-full" to={`/chamados/${created.id}?meu=1`}>
          Acompanhar chamado
          <ArrowRight size={18} />
        </Link>
        <Link className="text-link" to="/">
          Voltar ao mapa
        </Link>
        {isDemo && (
          <small className="muted">Registro fictício, disponível somente nesta sessão.</small>
        )}
      </div>
    </div>
  );
}
