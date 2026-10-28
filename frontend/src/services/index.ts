import { httpApi } from './http-api';
import { mockApi } from './mock-api';

export const isDemo = (import.meta.env.VITE_DATA_MODE || 'demo') === 'demo';
export const api = isDemo ? mockApi : httpApi;
