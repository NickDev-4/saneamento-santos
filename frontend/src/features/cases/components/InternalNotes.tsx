import type { Case } from '@/contracts';
import { date } from '@/shared/lib/date';
import { LockKeyhole } from 'lucide-react';

export function InternalNotes({ item }: { item: Case }) {
  return (
    <section className="content-card internal-notes">
      <div className="section-heading">
        <h2>
          <LockKeyhole size={18} />
          Observações internas
        </h2>
        <span className="internal-label">Somente Sabesp</span>
      </div>
      {!item.observacoesInternas?.length ? (
        <p className="muted">Nenhuma observação interna registrada.</p>
      ) : (
        item.observacoesInternas.map((n) => (
          <article key={n.id}>
            <time>{date(n.criadoEm, true)}</time>
            <p className="preserve-lines">{n.texto}</p>
          </article>
        ))
      )}
    </section>
  );
}
