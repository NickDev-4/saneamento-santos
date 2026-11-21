import { query } from './query';
import { environment } from '@/config/environment';
import type { Filters } from '@/contracts';
import { ApiError } from '@/shared/errors/ApiError';

export interface HttpClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  csrfToken?: () => string | undefined;
}

export interface HttpClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  pages<T>(path: string, filters?: Filters): Promise<T[]>;
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const base = (options.baseUrl ?? environment.apiBaseUrl).replace(/\/$/, '');
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  let csrfBootstrap: Promise<string> | undefined;
  const readCsrfToken = () => {
    if (options.csrfToken) return options.csrfToken();
    if (typeof document === 'undefined') return undefined;
    return document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
      ?.slice(11);
  };

  async function bootstrapCsrfToken(): Promise<string> {
    let response: Response;
    try {
      response = await fetcher(`${base}/auth/csrf`, { credentials: 'include' });
    } catch {
      throw new ApiError(
        'Não foi possível iniciar uma sessão segura. Verifique sua conexão e tente novamente.',
        0,
      );
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || 'Não foi possível iniciar uma sessão segura.',
        response.status,
        error.fieldErrors,
      );
    }
    const token = readCsrfToken();
    if (!token) {
      throw new ApiError('O servidor não forneceu um token de segurança.', 0);
    }
    return decodeURIComponent(token);
  }

  async function csrfHeader(): Promise<string> {
    const token = readCsrfToken();
    if (token) return decodeURIComponent(token);
    if (!csrfBootstrap) csrfBootstrap = bootstrapCsrfToken();
    try {
      return await csrfBootstrap;
    } finally {
      csrfBootstrap = undefined;
    }
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData))
      headers.set('Content-Type', 'application/json');
    const method = (init.method ?? 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method))
      headers.set('X-XSRF-TOKEN', await csrfHeader());
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, { ...init, headers, credentials: 'include' });
    } catch {
      throw new ApiError(
        'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
        0,
      );
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message ||
          (response.status === 401
            ? 'Sua sessão terminou. Entre novamente.'
            : 'Não foi possível concluir esta ação.'),
        response.status,
        error.fieldErrors,
      );
    }
    if (response.status === 204 || response.status === 205) return undefined as T;
    const body = await response.text();
    return body ? (JSON.parse(body) as T) : (undefined as T);
  }
  async function pages<T>(path: string, filters?: Filters): Promise<T[]> {
    const q = query(filters);
    q.set('size', '100');
    const items: T[] = [];
    for (let page = 0; page < 100; page++) {
      q.set('page', String(page));
      const result = await request<{ items: T[]; totalPages: number }>(`${path}?${q}`);
      items.push(...result.items);
      if (page + 1 >= result.totalPages) return items;
    }
    throw new Error('Há muitos resultados nesta consulta. Reduza a área ou aplique filtros.');
  }
  return { request, pages };
}
