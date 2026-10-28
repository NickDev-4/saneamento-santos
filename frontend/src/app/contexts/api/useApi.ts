import { ApiContext } from './ApiContext';
import { useContext } from 'react';

export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('ApiProvider ausente');
  return api;
}
