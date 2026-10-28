import type { Filters } from '@/contracts';

export const queryTags = {
  cases: ['cases'],
  notices: ['notices'],
  indicators: ['indicators'],
  catalogue: ['catalogue'],
  caseMutation: ['cases', 'indicators', 'notices'],
} as const;

export function filterKey(filters: Filters = {}) {
  return JSON.stringify(
    Object.entries(filters)
      .filter(([, value]) => value)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export const queryKeys = {
  cases: (scope: string, filters: string) => `cases:list:${scope}:${filters}`,
  case: (scope: string, id: string | undefined) => `cases:detail:${scope}:${id}`,
  types: 'catalogue:types',
  notices: 'notices',
  indicators: (filters: string) => `indicators:${filters}`,
};
