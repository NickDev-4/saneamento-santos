import { CancelCaseDialog } from '@/features/cases/components/CancelCaseDialog';
import { CaseGalleryDialog } from '@/features/cases/components/CaseGalleryDialog';
import { CaseHeading } from '@/features/cases/components/CaseHeading';
import { CaseLocation } from '@/features/cases/components/CaseLocation';
import { CaseOverview } from '@/features/cases/components/CaseOverview';
import { CaseOwnerActions } from '@/features/cases/components/CaseOwnerActions';
import { CasePublicationBanner } from '@/features/cases/components/CasePublicationBanner';
import { CaseRecurrence } from '@/features/cases/components/CaseRecurrence';
import { CaseTimeline } from '@/features/cases/components/CaseTimeline';
import { InternalNotes } from '@/features/cases/components/InternalNotes';
import { LinkedCaseBanner } from '@/features/cases/components/LinkedCaseBanner';
import { useCaseDetailPage } from '@/features/cases/hooks/useCaseDetailPage';
import { OperationPanel } from '@/features/cases/operations/OperationPanel';
import { BackLink } from '@/shared/ui/BackLink';
import { State } from '@/shared/ui/State';
import { Navigate } from 'react-router-dom';

export function CaseDetailPage({ operational = false }: { operational?: boolean }) {
  const {
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
  } = useCaseDetailPage(operational);
  if (scope === 'mine' && ready && !user)
    return (
      <Navigate to={`/entrar?retorno=${encodeURIComponent(`/chamados/${id}?meu=1`)}`} replace />
    );
  if (loading || error || !c)
    return (
      <div className="page-container">
        <BackLink to={operational ? '/sabesp' : '/'} />
        <State loading={loading} error={error} retry={retry} />
      </div>
    );
  return (
    <div className="page-container detail-page">
      <BackLink to={back}>
        {operational
          ? 'Fila de atendimento'
          : scope === 'mine'
            ? 'Meus chamados'
            : 'Voltar à consulta'}
      </BackLink>
      <CaseHeading c={c} />
      {c.publicacao !== 'APROVADO' && <CasePublicationBanner c={c} />}
      {c.vinculo && <LinkedCaseBanner c={c} />}
      <div className="detail-layout">
        <div className="detail-main">
          <CaseOverview c={c} setGalleryOpen={setGalleryOpen} />
          <CaseTimeline c={c} />
          {operational && <InternalNotes item={c} />}
        </div>
        <aside className="detail-aside">
          <CaseLocation c={c} />
          {c.acoesPermitidas.includes('editar') && (
            <CaseOwnerActions c={c} setCancelOpen={setCancelOpen} />
          )}
          {c.status === 'RESOLVIDO' && user?.perfil === 'CIDADAO' && <CaseRecurrence c={c} />}
          {operational && <OperationPanel item={c} />}
        </aside>
      </div>
      {cancelOpen && <CancelCaseDialog setCancelOpen={setCancelOpen} busy={busy} cancel={cancel} />}
      {galleryOpen && <CaseGalleryDialog c={c} setGalleryOpen={setGalleryOpen} />}
    </div>
  );
}
