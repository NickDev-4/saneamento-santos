import type { Api, Notice } from '@/contracts';
import type { HttpClient } from '@/services/http/client';

export function createNoticesService({
  request,
  pages,
}: HttpClient): Pick<Api, 'notices' | 'markRead'> {
  const service: Pick<Api, 'notices' | 'markRead'> = {
    notices: () => pages<Notice>('/me/notificacoes'),
    markRead: (id) =>
      request(`/me/notificacoes/${encodeURIComponent(id)}/leitura`, { method: 'PATCH' }),
  };
  return service;
}
