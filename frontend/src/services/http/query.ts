import type { Filters } from '@/contracts';

export function query(filters: Filters = {}) {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  return q;
}
