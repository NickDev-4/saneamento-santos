import { ApiContext } from './ApiContext';
import type { Api } from '@/contracts';
import type { ReactNode } from 'react';

export function ApiProvider({ service, children }: { service: Api; children: ReactNode }) {
  return <ApiContext value={service}>{children}</ApiContext>;
}
