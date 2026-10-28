import type { Case } from '@/contracts';
import { AuthorContact } from '@/features/cases/operations/AuthorContact';
import { CommentComposer } from '@/features/cases/operations/CommentComposer';
import { OperationActions } from '@/features/cases/operations/OperationActions';
import { OperationDialog } from '@/features/cases/operations/OperationDialog';
import { useCaseOperations } from '@/features/cases/operations/useCaseOperations';
import { Wrench } from 'lucide-react';

export function OperationPanel({ item: c }: { item: Case }) {
  const {
    action,
    setAction,
    busy,
    internal,
    setInternal,
    comment,
    setComment,
    formError,
    others,
    can,
    actionTitle,
    open,
    updateStatus,
    submit,
    sendComment,
    approvePublication,
  } = useCaseOperations(c);
  return (
    <>
      <section className="content-card operation-panel">
        <div className="section-heading">
          <h2>
            <Wrench size={18} />
            Atendimento
          </h2>
        </div>
        {c.autor && <AuthorContact c={c} />}
        <OperationActions
          can={can}
          busy={busy}
          updateStatus={updateStatus}
          c={c}
          open={open}
          approvePublication={approvePublication}
        />
      </section>
      <CommentComposer
        internal={internal}
        setInternal={setInternal}
        comment={comment}
        setComment={setComment}
        busy={busy}
        sendComment={sendComment}
      />
      {action && (
        <OperationDialog
          action={action}
          c={c}
          others={others}
          formError={formError}
          setAction={setAction}
          busy={busy}
          submit={submit}
          actionTitle={actionTitle}
        />
      )}
    </>
  );
}
