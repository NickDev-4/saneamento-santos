import { CaseCard } from '@/features/cases/components/CaseCard';
import { useMyCases } from '@/features/cases/hooks/useMyCases';
import { PageTitle } from '@/shared/ui/PageTitle';
import { State } from '@/shared/ui/State';
import { ClipboardList, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyCasesPage() {
  const { loading, error, retry, filter, setFilter, list } = useMyCases();
  return (
    <div className="page-container">
      <PageTitle
        eyebrow="SUA PARTICIPAÇÃO FAZ DIFERENÇA"
        title="Meus chamados"
        description="Acompanhe seus registros, do primeiro relato à resolução."
        action={
          <Link className="button button-primary" to="/registrar">
            <Plus size={18} />
            Novo chamado
          </Link>
        }
      />
      <div className="content-card">
        <div className="filter-chips spacious">
          <button className={!filter ? 'active' : ''} onClick={() => setFilter('')}>
            Todos
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Em andamento
          </button>
          <button
            className={filter === 'RESOLVIDO' ? 'active' : ''}
            onClick={() => setFilter('RESOLVIDO')}
          >
            Resolvidos
          </button>
          <button
            className={filter === 'VINCULADO' ? 'active' : ''}
            onClick={() => setFilter('VINCULADO')}
          >
            Vinculados
          </button>
        </div>
        {loading || error ? (
          <State loading={loading} error={error} retry={retry} />
        ) : list.length ? (
          <div className="my-case-list">
            {list.map((c) => (
              <CaseCard item={c} key={c.id} to={`/chamados/${c.id}?meu=1`} />
            ))}
          </div>
        ) : (
          <State
            title="Você ainda não tem chamados aqui"
            text="Registre um problema de esgoto e acompanhe o atendimento por aqui."
          >
            <Link className="button button-primary" to="/registrar">
              <ClipboardList size={17} />
              Registrar problema
            </Link>
          </State>
        )}
      </div>
    </div>
  );
}
