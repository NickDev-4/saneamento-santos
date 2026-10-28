import type { Api } from '@/contracts';
import { createContext } from 'react';

export const NoticesContext = createContext<Pick<Api, 'markRead'> | null>(null);
