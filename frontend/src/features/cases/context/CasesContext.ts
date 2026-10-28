import type { Api } from '@/contracts';
import { createContext } from 'react';

export type CaseActions = Pick<
  Api,
  'save' | 'cancel' | 'transition' | 'publish' | 'schedule' | 'link' | 'comment'
>;

export const CasesContext = createContext<CaseActions | null>(null);
