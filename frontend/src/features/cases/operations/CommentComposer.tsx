import type { CaseOperationsController } from '@/features/cases/operations/useCaseOperations';
import { Button } from '@/shared/ui/Button';
import { Eye, LockKeyhole, Send } from 'lucide-react';

type Props = Pick<
  CaseOperationsController,
  'internal' | 'setInternal' | 'comment' | 'setComment' | 'busy' | 'sendComment'
>;

export function CommentComposer({
  internal,
  setInternal,
  comment,
  setComment,
  busy,
  sendComment,
}: Props) {
  return (
    <section className="content-card comment-panel">
      <h2>Registrar atualização</h2>
      <div className="segmented-control">
        <button className={!internal ? 'active' : ''} onClick={() => setInternal(false)}>
          <Eye size={14} />
          Pública
        </button>
        <button className={internal ? 'active' : ''} onClick={() => setInternal(true)}>
          <LockKeyhole size={14} />
          Interna
        </button>
      </div>
      <p className="small muted">
        {internal
          ? 'Visível somente para a equipe Sabesp.'
          : 'Visível no acompanhamento do chamado após aprovação da publicação.'}
      </p>
      <form onSubmit={sendComment}>
        <label className="sr-only" htmlFor="comentario">
          {internal ? 'Observação interna' : 'Atualização pública'}
        </label>
        <textarea
          id="comentario"
          rows={4}
          required
          placeholder={
            internal ? 'Anotação para a equipe…' : 'Informe uma atualização do atendimento…'
          }
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button className="button-full" variant="secondary" disabled={busy || !comment.trim()}>
          <Send size={16} />
          {internal ? 'Salvar observação' : 'Publicar atualização'}
        </Button>
      </form>
    </section>
  );
}
