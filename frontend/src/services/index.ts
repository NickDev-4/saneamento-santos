import { httpApi } from './http-api';
import { mockApi } from './mock-api';
import { isDemo } from '@/config/environment';

export { isDemo } from '@/config/environment';

export const api = isDemo ? mockApi : httpApi;
