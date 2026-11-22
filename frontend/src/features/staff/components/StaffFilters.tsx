import type { Status } from '@/contracts';
import { statusLabels } from '@/contracts';
import type { StaffQueueController } from '@/features/staff/hooks/useStaffQueue';
import { SearchInput } from '@/shared/ui/SearchInput';

type Props = Pick<
  StaffQueueController,
  'query' | 'setQuery' | 'status' | 'setStatus'
>;

export function StaffFilters({ query, setQuery, status, setStatus }: Props) {
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
    </div>
  );
}
