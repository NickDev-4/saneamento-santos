import type { Api, User } from '@/contracts';
import { ApiError } from '@/shared/errors/ApiError';
import type { HttpClient } from '@/services/http/client';

const json = (body: unknown) => JSON.stringify(body);

export function createAuthService({
  request,
}: HttpClient): Pick<Api, 'me' | 'login' | 'signup' | 'logout' | 'recover' | 'updateProfile'> {
  const service: Pick<Api, 'me' | 'login' | 'signup' | 'logout' | 'recover' | 'updateProfile'> = {
    async me() {
      try {
        return await request<User>('/auth/me');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    login: (input) =>
      request('/auth/login', {
        method: 'POST',
        body: json({ email: input.email, senha: input.senha }),
      }),
    async signup(input) {
      await request('/auth/cadastro', { method: 'POST', body: json(input) });
      return service.login({ email: input.email, senha: input.senha });
    },
    logout: () => request('/auth/logout', { method: 'POST' }),
    recover: (email) => request('/auth/recuperacao', { method: 'POST', body: json({ email }) }),
    updateProfile: (input) =>
      request('/me', {
        method: 'PATCH',
        body: json({ nome: input.nome, telefone: input.telefone }),
      }),
  };
  return service;
}
