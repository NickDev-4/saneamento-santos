import type { QueryCache } from './query-cache';
import { createContext } from 'react';

export const QueryContext = createContext<QueryCache | null>(null);
