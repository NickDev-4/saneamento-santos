import { useAuth } from '@/app/contexts/auth/useAuth';
import { useFeedback } from '@/app/contexts/feedback/useFeedback';
import { useCaseActions } from '@/features/cases/context/useCaseActions';
import { useCase } from '@/features/cases/hooks/useCase';
import { useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

export function useCaseDetailPage(operational: boolean) {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { user, ready } = useAuth();
  const { runAction } = useFeedback();
  const actions = useCaseActions();
  const scope = operational ? 'staff' : params.has('meu') ? 'mine' : 'public';
  const { data: c, loading, error, retry } = useCase(id, scope);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const back = operational
    ? '/sabesp'
    : scope === 'mine'
      ? '/meus-chamados'
      : user?.perfil === 'PREFEITURA'
        ? '/prefeitura'
        : '/';
  async function cancel() {
    setBusy(true);
    const ok = await runAction(() => actions.cancel(id), 'Chamado cancelado.');
    setBusy(false);
    if (ok) setCancelOpen(false);
  }
  return {
    id,
    user,
    ready,
    scope,
    c,
    loading,
    error,
    retry,
    cancelOpen,
    setCancelOpen,
    galleryOpen,
    setGalleryOpen,
    busy,
    back,
    cancel,
  };
}

export type CaseDetailController = ReturnType<typeof useCaseDetailPage>;
