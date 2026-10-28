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
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData))
      headers.set('Content-Type', 'application/json');
    const csrf = options.csrfToken
      ? options.csrfToken()
      : document.cookie
          .split('; ')
          .find((c) => c.startsWith('XSRF-TOKEN='))
          ?.slice(11);
    if (csrf && init.method && init.method !== 'GET')
      headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf));
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
    if (response.status === 204) return undefined as T;
    return response.json();
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
