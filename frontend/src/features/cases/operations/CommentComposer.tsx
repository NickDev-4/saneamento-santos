import type { CaseOperationsController } from '@/features/cases/operations/useCaseOperations';
import { Button } from '@/shared/ui/Button';
import { Send } from 'lucide-react';

type Props = Pick<
  CaseOperationsController,
  'comment' | 'setComment' | 'busy' | 'sendComment'
>;

export function CommentComposer({
  comment,
  setComment,
  busy,
  sendComment,
}: Props) {
  return (
    <section className="content-card comment-panel">
      <h2>Registrar atualização</h2>
      <p className="small muted">
        A atualização ficará visível no acompanhamento do chamado.
      </p>
      <form onSubmit={sendComment}>
        <label className="sr-only" htmlFor="comentario">
          Atualização pública
        </label>
        <textarea
          id="comentario"
          rows={4}
          required
          placeholder="Informe uma atualização do atendimento…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button className="button-full" variant="secondary" disabled={busy || !comment.trim()}>
          <Send size={16} />
          Publicar atualização
        </Button>
      </form>
    </section>
  );
}
