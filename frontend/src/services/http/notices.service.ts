import type { Api, Notice } from '@/contracts';
import type { HttpClient } from '@/services/http/client';

export function createNoticesService({
  request,
  pages,
}: HttpClient): Pick<Api, 'notices' | 'markRead'> {
  type ApiNotice = {
    id: string;
    chamadoId: string;
    titulo: string;
    mensagem: string;
    criadoEm: string;
    lida: boolean;
  };
  const service: Pick<Api, 'notices' | 'markRead'> = {
    async notices() {
      const rows = await pages<ApiNotice>('/me/notificacoes');
      return rows.map(({ mensagem, ...item }): Notice => ({ ...item, texto: mensagem }));
    },
    markRead: (id) =>
      request(`/me/notificacoes/${encodeURIComponent(id)}/leitura`, { method: 'PATCH' }),
  };
  return service;
}
