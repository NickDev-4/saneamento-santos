import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Api } from '../../contracts';

const ApiContext = createContext<Api | null>(null);

export function ApiProvider({ service, children }: { service: Api; children: ReactNode }) {
  return <ApiContext value={service}>{children}</ApiContext>;
}

// Uso interno dos providers. As telas consomem os hooks de domínio.
export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('ApiProvider ausente');
  return api;
}
