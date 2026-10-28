import type { Case } from '@/contracts';

type Props = {} & { c: Case };

export function AuthorContact({ c }: Props) {
  if (!c.autor) return null;
  return (
    <div className="author-contact">
      <span className="muted small">Contato do autor</span>
      <strong>{c.autor.nome}</strong>
      <span>{c.autor.email}</span>
      {c.autor.telefone && <span>{c.autor.telefone}</span>}
    </div>
  );
}
