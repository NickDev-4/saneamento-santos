import type { Status } from '@/contracts';
import { statusLabels } from '@/contracts';
import type { StaffQueueController } from '@/features/staff/hooks/useStaffQueue';
import { SearchInput } from '@/shared/ui/SearchInput';

type Props = Pick<
  StaffQueueController,
  'query' | 'setQuery' | 'status' | 'setStatus' | 'publication' | 'setPublication'
>;

export function StaffFilters({
  query,
  setQuery,
  status,
  setStatus,
  publication,
  setPublication,
}: Props) {
  return (
    <div className="institution-filters">
      <SearchInput value={query} onChange={setQuery} />
      <label className="sr-only" htmlFor="fila-status">
        Filtrar status
      </label>
      <select id="fila-status" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Todos os status</option>
        {(Object.entries(statusLabels) as [Status, string][]).map(([s, name]) => (
          <option key={s} value={s}>
            {name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="fila-publicacao">
        Filtrar publicação
      </label>
      <select
        id="fila-publicacao"
        value={publication}
        onChange={(e) => setPublication(e.target.value)}
      >
        <option value="">Todas as publicações</option>
        <option value="PENDENTE">Pendente</option>
        <option value="APROVADO">Publicado</option>
        <option value="REJEITADO">Não aprovado</option>
      </select>
    </div>
  );
}
