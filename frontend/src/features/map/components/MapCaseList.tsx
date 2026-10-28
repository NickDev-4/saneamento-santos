import type { MapController } from '@/features/map/hooks/useMapPage';

import { SearchInput } from '@/shared/ui/SearchInput';

import { SlidersHorizontal } from 'lucide-react';

import { ChevronUp } from 'lucide-react';

import { ChevronDown } from 'lucide-react';

import { statusLabels } from '@/contracts';

import { publicStatuses } from '@/features/cases/constants/publicStatuses';

import { X } from 'lucide-react';

import { Button } from '@/shared/ui/Button';

import { State } from '@/shared/ui/State';

import { CaseCard } from '@/features/cases/components/CaseCard';

type Props = Pick<
  MapController,
  | 'search'
  | 'update'
  | 'filtered'
  | 'setFiltersOpen'
  | 'expanded'
  | 'setExpanded'
  | 'status'
  | 'bairro'
  | 'setParams'
  | 'setSelectedId'
  | 'loading'
  | 'error'
  | 'retry'
>;

export function MapCaseList({
  search,
  update,
  filtered,
  setFiltersOpen,
  expanded,
  setExpanded,
  status,
  bairro,
  setParams,
  setSelectedId,
  loading,
  error,
  retry,
}: Props) {
  return (
    <>
      <div className="sheet-search">
        <SearchInput value={search} onChange={(v) => update('q', v)} />
      </div>
      <div className="sheet-title" data-sheet-drag-area>
        <div>
          <h2>
            Chamados na cidade<span className="count-pill">{filtered.length}</span>
          </h2>
          <p>Relatos validados para acompanhamento</p>
        </div>
        <button
          className="icon-button sheet-filter"
          aria-label="Abrir filtros"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={18} />
        </button>
        <button
          className="icon-button sheet-size"
          aria-label={expanded ? 'Recolher lista' : 'Expandir lista'}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      <div className="filter-chips" aria-label="Filtrar por status">
        <button className={!status ? 'active' : ''} onClick={() => update('status', '')}>
          Todos
        </button>
        {publicStatuses.map((s) => (
          <button
            key={s}
            className={status === s ? 'active' : ''}
            onClick={() => update('status', s)}
          >
            {s === 'VISITA_AGENDADA' ? 'Agendados' : statusLabels[s]}
          </button>
        ))}
      </div>
      {bairro && (
        <button className="applied-filter" onClick={() => update('bairro', '')}>
          {bairro}
          <X size={13} />
        </button>
      )}
      <div className="sheet-cases">
        {loading || error ? (
          <State loading={loading} error={error} retry={retry} />
        ) : filtered.length ? (
          filtered.map((c) => (
            <CaseCard
              key={c.id}
              item={c}
              onSelect={() => {
                setSelectedId(c.id);
                setExpanded(true);
              }}
            />
          ))
        ) : (
          <State
            title="Nenhum resultado encontrado"
            text="Tente outro endereço ou remova os filtros."
          >
            <Button
              variant="secondary"
              onClick={() => {
                setParams({});
              }}
            >
              Limpar filtros
            </Button>
          </State>
        )}
      </div>
      <div className="sheet-footer">
        <span className="live-dot" />
        Informações atualizadas pela equipe responsável
      </div>
    </>
  );
}
