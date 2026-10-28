import type { Case } from '@/contracts';
import type { CaseDetailController } from '@/features/cases/hooks/useCaseDetailPage';
import { date } from '@/shared/lib/date';
import { ChevronRight, Clock3, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = Pick<CaseDetailController, 'setGalleryOpen'> & { c: Case };

export function CaseOverview({ c, setGalleryOpen }: Props) {
  return (
    <section className="content-card case-overview">
      <div className="detail-photo">
        <img
          src={c.imagens[0]?.url || '/cenario-esgoto.svg'}
          alt={
            c.imagens[0]?.ilustrativa
              ? 'Ilustração de um cenário fictício de extravasamento de esgoto'
              : 'Foto do problema relatado'
          }
        />
        <button onClick={() => setGalleryOpen(true)}>
          <ImageIcon size={16} />
          {c.imagens.length} {c.imagens.length === 1 ? 'imagem' : 'imagens'}
        </button>
      </div>
      <div className="section-content">
        <div className="section-heading">
          <h2>Sobre o problema</h2>
          <span className="small muted">Registrado em {date(c.criadoEm)}</span>
        </div>
        <p className="preserve-lines">{c.descricao}</p>
        <div className="observed-row">
          <Clock3 size={16} />
          <span>Observado em {date(c.observadoEm, true)}</span>
        </div>
        {c.reincidenciaDe && (
          <Link className="text-link" to={`/chamados/${c.reincidenciaDe}`}>
            Consultar atendimento anterior
            <ChevronRight size={16} />
          </Link>
        )}
        {c.motivoEncerramento && (
          <div className="info-banner">
            <p>
              <strong>Motivo do encerramento</strong>
              <span>{c.motivoEncerramento}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
