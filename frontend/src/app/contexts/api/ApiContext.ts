import type { Api } from '@/contracts';
import { createContext } from 'react';

export const ApiContext = createContext<Api | null>(null);
