import { QueryContext } from './QueryContext';
import { useContext } from 'react';

export function useQueryClient() {
  const cache = useContext(QueryContext);
  if (!cache) throw new Error('QueryProvider ausente');
  return cache;
}
