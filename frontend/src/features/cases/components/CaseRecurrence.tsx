import type { Case } from '@/contracts';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {} & { c: Case };

export function CaseRecurrence({ c }: Props) {
  return (
    <section className="content-card recurrence-card">
      <CheckCircle2 size={27} />
      <h3>O problema voltou?</h3>
      <p>Crie um novo relato para registrar a reincidência e preservar o histórico.</p>
      <Link className="button button-secondary button-full" to={`/registrar?reincidencia=${c.id}`}>
        Registrar reincidência
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
