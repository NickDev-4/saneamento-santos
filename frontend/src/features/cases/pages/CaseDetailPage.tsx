import { CaseGalleryDialog } from '@/features/cases/components/CaseGalleryDialog';
import { CaseHeading } from '@/features/cases/components/CaseHeading';
import { CaseLocation } from '@/features/cases/components/CaseLocation';
import { CaseOverview } from '@/features/cases/components/CaseOverview';
import { CasePublicationBanner } from '@/features/cases/components/CasePublicationBanner';
import { CaseTimeline } from '@/features/cases/components/CaseTimeline';
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
    galleryOpen,
    setGalleryOpen,
    back,
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
      <div className="detail-layout">
        <div className="detail-main">
          <CaseOverview c={c} setGalleryOpen={setGalleryOpen} />
          <CaseTimeline c={c} />
        </div>
        <aside className="detail-aside">
          <CaseLocation c={c} />
          {operational && <OperationPanel item={c} />}
        </aside>
      </div>
      {galleryOpen && <CaseGalleryDialog c={c} setGalleryOpen={setGalleryOpen} />}
    </div>
  );
}
