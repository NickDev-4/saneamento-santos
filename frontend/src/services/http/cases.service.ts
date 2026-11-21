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
  type OperationalCaseSummary = {
    id: string;
    protocolo: string;
    tipoId: string;
    tipo: string;
    status: Case['status'];
    publicacao: Case['publicacao'];
    bairro: string;
    endereco: string;
    criadoEm: string;
    atualizadoEm: string;
    previsaoVisita: Case['previsaoVisita'];
  };
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
    async list(scope, filters) {
      if (scope !== 'staff')
        return pages<Case>(scope === 'mine' ? '/me/chamados' : '/public/chamados', filters);

      const rows = await pages<OperationalCaseSummary>('/operacao/chamados', filters);
      return rows.map((row): Case => ({
        id: row.id,
        protocolo: row.protocolo,
        tipoId: row.tipoId,
        tipo: row.tipo,
        descricao: '',
        observadoEm: row.criadoEm,
        criadoEm: row.criadoEm,
        atualizadoEm: row.atualizadoEm,
        endereco: {
          cep: '',
          logradouro: row.endereco.endsWith(`, ${row.bairro}`)
            ? row.endereco.slice(0, -(row.bairro.length + 2))
            : row.endereco,
          numero: '',
          semNumero: false,
          bairro: row.bairro,
          cidade: 'Santos',
          uf: 'SP',
          referencia: '',
        },
        localizacao: { latitude: 0, longitude: 0 },
        status: row.status,
        publicacao: row.publicacao,
        imagens: [],
        previsaoVisita: row.previsaoVisita,
        atualizacoes: [],
        reincidenciaDe: null,
        acoesPermitidas: [],
      }));
    },
    async detail(id, scope) {
      const c = await request<Case>(
        `${scope === 'public' ? '/public' : ''}/chamados/${encodeURIComponent(id)}`,
      );
      if (scope === 'staff') {
        const notes = await request<{ items: { id: string; texto: string; criadoEm: string }[] }>(
          `/chamados/${encodeURIComponent(id)}/observacoes-internas`,
        );
        c.observacoesInternas = notes.items.map((item) => ({ ...item }));
      }
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
        new Blob(
          [
            json({
              status,
              comentarioPublico: status === 'RESOLVIDO' ? texto : undefined,
              justificativa: status === 'ENCERRADO_SEM_ATENDIMENTO' ? texto : undefined,
            }),
          ],
          { type: 'application/json' },
        ),
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
        {
          method: 'POST',
          body: json(internal ? { texto } : { titulo: 'Atualização do chamado', texto }),
        },
      ),
  };
  return service;
}
