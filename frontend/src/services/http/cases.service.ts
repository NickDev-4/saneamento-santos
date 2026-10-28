import type { Api, Case } from '@/contracts';
import type { HttpClient } from '@/services/http/client';
import { form } from '@/services/http/multipart';

const json = (body: unknown) => JSON.stringify(body);

export function createCasesService({
  request,
  pages,
}: HttpClient): Pick<
  Api,
  | 'types'
  | 'list'
  | 'detail'
  | 'save'
  | 'cancel'
  | 'transition'
  | 'publish'
  | 'schedule'
  | 'link'
  | 'comment'
> {
  const service: Pick<
    Api,
    | 'types'
    | 'list'
    | 'detail'
    | 'save'
    | 'cancel'
    | 'transition'
    | 'publish'
    | 'schedule'
    | 'link'
    | 'comment'
  > = {
    types: () => request('/public/tipos-chamado'),
    list: (scope, filters) =>
      pages<Case>(
        scope === 'staff'
          ? '/operacao/chamados'
          : scope === 'mine'
            ? '/me/chamados'
            : '/public/chamados',
        filters,
      ),
    async detail(id, scope) {
      const c = await request<Case>(
        `${scope === 'public' ? '/public' : ''}/chamados/${encodeURIComponent(id)}`,
      );
      if (scope === 'staff')
        c.observacoesInternas = await request(
          `/chamados/${encodeURIComponent(id)}/observacoes-internas`,
        );
      return c;
    },
    save: (input, id) =>
      request(id ? `/chamados/${encodeURIComponent(id)}` : '/chamados', {
        method: id ? 'PATCH' : 'POST',
        body: form(input),
      }),
    cancel: (id) => request(`/chamados/${encodeURIComponent(id)}/cancelamento`, { method: 'POST' }),
    transition: (id, status, texto, foto) => {
      const body = new FormData();
      body.append(
        'dados',
        new Blob([json({ status, comentarioPublico: texto })], { type: 'application/json' }),
      );
      if (foto) body.append('imagemResolucao', foto);
      return request(`/chamados/${encodeURIComponent(id)}/status`, { method: 'PATCH', body });
    },
    publish: (id, approved, motivo) =>
      request(`/chamados/${encodeURIComponent(id)}/publicacao`, {
        method: 'PATCH',
        body: json({ publicacao: approved ? 'APROVADO' : 'REJEITADO', justificativa: motivo }),
      }),
    schedule: (id, inicio, fim) =>
      request(`/chamados/${encodeURIComponent(id)}/previsao`, {
        method: 'PATCH',
        body: json({ inicio, fim }),
      }),
    link: (id, principalId, motivo) =>
      request(`/chamados/${encodeURIComponent(id)}/vinculo`, {
        method: 'POST',
        body: json({ chamadoPrincipalId: principalId, justificativa: motivo }),
      }),
    comment: (id, texto, internal) =>
      request(
        `/chamados/${encodeURIComponent(id)}/${internal ? 'observacoes-internas' : 'atualizacoes-publicas'}`,
        { method: 'POST', body: json({ texto }) },
      ),
  };
  return service;
}
