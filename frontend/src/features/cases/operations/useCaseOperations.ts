import { useFeedback } from '@/app/contexts/feedback/useFeedback';
import type { Case, Status } from '@/contracts';
import { useCaseActions } from '@/features/cases/context/useCaseActions';
import { useCases } from '@/features/cases/hooks/useCases';
import type { FormEvent } from 'react';
import { useState } from 'react';

type Action = 'agendar' | 'resolver' | 'encerrar' | 'vincular' | 'rejeitar';

export function useCaseOperations(c: Case) {
  const { runAction } = useFeedback();
  const actions = useCaseActions();
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [internal, setInternal] = useState(false);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const others = useCases('staff');
  const can = (a: string) => c.acoesPermitidas.includes(a);
  const actionTitle: Record<Action, string> = {
    agendar: 'Agendar visita',
    resolver: 'Concluir atendimento',
    encerrar: 'Encerrar sem atendimento',
    vincular: 'Vincular a outro chamado',
    rejeitar: 'Não aprovar publicação',
  };
  function open(a: Action) {
    setFormError('');
    setAction(a);
  }
  async function updateStatus(status: Status) {
    setBusy(true);
    await runAction(() => actions.transition(c.id, status), 'Status atualizado.');
    setBusy(false);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    const f = new FormData(e.currentTarget);
    setBusy(true);
    let work: () => Promise<unknown>;
    const text = String(f.get('texto') || '').trim();
    if (action === 'agendar') {
      const start = String(f.get('inicio'));
      const end = String(f.get('fim'));
      if (!start || !end || new Date(end) <= new Date(start)) {
        setFormError('Informe uma janela com término posterior ao início.');
        setBusy(false);
        return;
      }
      work = () =>
        actions.schedule(c.id, new Date(start).toISOString(), new Date(end).toISOString());
    } else if (!text) {
      setFormError('Escreva a justificativa ou descrição solicitada.');
      setBusy(false);
      return;
    } else if (action === 'vincular') {
      const principal = String(f.get('principal'));
      if (!principal) {
        setFormError('Selecione o atendimento principal.');
        setBusy(false);
        return;
      }
      work = () => actions.link(c.id, principal, text);
    } else if (action === 'rejeitar') work = () => actions.publish(c.id, false, text);
    else {
      const foto = f.get('foto') as File | null;
      if (
        foto?.size &&
        (foto.size > 5 * 1024 * 1024 ||
          !['image/jpeg', 'image/png', 'image/webp'].includes(foto.type))
      ) {
        setFormError('Use uma foto JPG, PNG ou WebP de até 5 MB.');
        setBusy(false);
        return;
      }
      work = () =>
        actions.transition(
          c.id,
          action === 'resolver' ? 'RESOLVIDO' : 'ENCERRADO_SEM_ATENDIMENTO',
          text,
          foto?.size ? foto : undefined,
        );
    }
    const ok = await runAction(work, 'Atendimento atualizado.');
    setBusy(false);
    if (ok) setAction(null);
  }
  async function sendComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    const ok = await runAction(
      () => actions.comment(c.id, comment.trim(), internal),
      internal ? 'Observação interna salva.' : 'Atualização pública salva.',
    );
    setBusy(false);
    if (ok) setComment('');
  }
  async function approvePublication() {
    setBusy(true);
    await runAction(() => actions.publish(c.id, true), 'Publicação aprovada.');
    setBusy(false);
  }
  return {
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
  };
}

export type CaseOperationsController = ReturnType<typeof useCaseOperations>;
