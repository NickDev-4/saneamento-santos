import type { Case } from '@/contracts';
import { date } from '@/shared/lib/date';
import { Check, MessageSquare } from 'lucide-react';

type Props = {} & { c: Case };

export function CaseTimeline({ c }: Props) {
  return (
    <section className="content-card timeline-section">
      <div className="section-heading">
        <h2>Acompanhe o atendimento</h2>
        <MessageSquare size={20} />
      </div>
      <ol className="timeline">
        {[...c.atualizacoes]
          .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
          .map((u, i) => (
            <li key={u.id}>
              <span className={`timeline-node ${i === 0 ? 'latest' : ''}`}>
                {i === 0 ? <Check size={13} /> : <span />}
              </span>
              <div>
                <time>{date(u.criadoEm, true)}</time>
                <h3>{u.titulo || 'Atualização da equipe'}</h3>
                <p className="preserve-lines">{u.texto}</p>
              </div>
            </li>
          ))}
      </ol>
    </section>
  );
}
