import { CaseTable } from '@/features/cases/components/CaseTable';
import { StaffFilters } from '@/features/staff/components/StaffFilters';
import { StaffOverview } from '@/features/staff/components/StaffOverview';
import { useStaffQueue } from '@/features/staff/hooks/useStaffQueue';
import { Button } from '@/shared/ui/Button';
import { PageTitle } from '@/shared/ui/PageTitle';
import { State } from '@/shared/ui/State';
import { RefreshCw } from 'lucide-react';

export function StaffPage() {
  const {
    data,
    loading,
    error,
    retry,
    query,
    setQuery,
    status,
    setStatus,
    publication,
    setPublication,
    list,
  } = useStaffQueue();
  return (
    <div className="page-container institution-page">
      <PageTitle
        eyebrow="ÁREA SABESP"
        title="Central de atendimento"
        description="Organize a fila e acompanhe cada etapa dos chamados."
        action={
          <Button variant="secondary" onClick={retry}>
            <RefreshCw size={16} />
            Atualizar
          </Button>
        }
      />
      <StaffOverview data={data} />
      <section className="content-card institution-list">
        <div className="institution-list-heading">
          <div>
            <h2>
              Fila de chamados<span className="count-pill">{list.length}</span>
            </h2>
            <p>Selecione um registro para analisar ou atualizar.</p>
          </div>
        </div>
        <StaffFilters
          query={query}
          setQuery={setQuery}
          status={status}
          setStatus={setStatus}
          publication={publication}
          setPublication={setPublication}
        />
        {loading || error ? (
          <State loading={loading} error={error} retry={retry} />
        ) : list.length ? (
          <CaseTable cases={list} staff />
        ) : (
          <State
            title="Nenhum chamado neste filtro"
            text="Tente outro termo ou escolha todos os status."
          />
        )}
      </section>
    </div>
  );
}
