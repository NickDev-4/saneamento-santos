import type { Api, Case, Status } from '@/contracts';
import { activeStatuses, statusLabels, typeOptions } from '@/contracts';
import type { DemoContext } from '@/services/demo/context';

export function createDemoCasesService(
  context: DemoContext,
): Pick<
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
  const {
    copy,
    pause,
    project,
    permitted,
    matches,
    cases,
    find,
    requireUser,
    images,
    now,
    uid,
    changed,
    staff,
    fileData,
  } = context;
  return {
    async types() {
      return copy(typeOptions);
    },
    async list(scope, filters) {
      await pause();
      return cases
        .filter((c) => permitted(c, scope) && matches(c, filters))
        .map((c) => project(c, scope))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    },
    async detail(id, scope) {
      await pause();
      const c = find(id);
      if (!permitted(c, scope))
        throw new Error('Este chamado não está disponível para esta conta.');
      return project(c, scope);
    },
    async save(input, id) {
      await pause();
      const user = requireUser();
      if (user.perfil !== 'CIDADAO') throw new Error('Use uma conta de cidadão para registrar.');
      const imgs = await images(input);
      const tipo = typeOptions.find((t) => t.id === input.tipoId)?.nome ?? 'Problema de esgoto';
      if (id) {
        const c = find(id);
        if (c.autor?.id !== user.id || c.status !== 'RECEBIDO')
          throw new Error('Este registro já está em análise e não pode mais ser editado.');
        Object.assign(c, {
          tipo,
          tipoId: input.tipoId,
          descricao: input.descricao,
          observadoEm: input.observadoEm,
          endereco: copy(input.endereco),
          localizacao: copy(input.localizacao),
          imagens: imgs,
          atualizadoEm: now(),
        });
        return project(c, 'mine');
      }
      const c: Case = {
        id: uid(),
        protocolo: `DEMO-${150 + cases.length}`,
        tipoId: input.tipoId,
        tipo,
        descricao: input.descricao,
        observadoEm: input.observadoEm,
        criadoEm: now(),
        atualizadoEm: now(),
        endereco: copy(input.endereco),
        localizacao: copy(input.localizacao),
        imagens: imgs,
        status: 'RECEBIDO',
        publicacao: 'PENDENTE',
        previsaoVisita: null,
        autor: copy(user),
        atualizacoes: [
          {
            id: uid(),
            titulo: 'Chamado recebido',
            texto: 'Seu relato aguarda validação da equipe.',
            criadoEm: now(),
          },
        ],
        observacoesInternas: [],
        acoesPermitidas: [],
        reincidenciaDe: input.reincidenciaDe,
      };
      cases.unshift(c);
      return project(c, 'mine');
    },
    async cancel(id) {
      await pause();
      const c = find(id);
      if (c.autor?.id !== requireUser().id || c.status !== 'RECEBIDO')
        throw new Error('O cancelamento está disponível apenas antes da análise.');
      c.status = 'CANCELADO';
      changed(c, 'Chamado cancelado', 'Registro cancelado pelo autor.');
    },
    async transition(id, status, texto, foto) {
      await pause();
      staff();
      const c = find(id);
      const next: Partial<Record<Status, Status>> = {
        RECEBIDO: 'EM_ANALISE',
        VISITA_AGENDADA: 'EM_ATENDIMENTO',
        EM_ATENDIMENTO: 'RESOLVIDO',
      };
      if (status === 'ENCERRADO_SEM_ATENDIMENTO') {
        if (!activeStatuses.includes(c.status) || !texto?.trim())
          throw new Error('Informe a justificativa de encerramento.');
      } else if (next[c.status] !== status)
        throw new Error('A situação do chamado mudou. Atualize a página.');
      if (status === 'RESOLVIDO' && !texto?.trim())
        throw new Error('Descreva a solução realizada.');
      if (foto) c.imagens.push({ id: uid(), url: await fileData(foto) });
      c.status = status;
      if (status === 'ENCERRADO_SEM_ATENDIMENTO') {
        c.motivoEncerramento = texto;
        c.previsaoVisita = null;
      }
      changed(
        c,
        statusLabels[status],
        texto || `Atendimento atualizado para ${statusLabels[status].toLowerCase()}.`,
      );
    },
    async publish(id, approved, motivo) {
      await pause();
      staff();
      const c = find(id);
      if (!activeStatuses.includes(c.status)) throw new Error('Este atendimento está encerrado.');
      if (!approved && !motivo?.trim()) throw new Error('Informe o motivo.');
      c.publicacao = approved ? 'APROVADO' : 'REJEITADO';
      changed(
        c,
        approved ? 'Publicação aprovada' : 'Publicação não aprovada',
        approved ? 'O relato está disponível no mapa público.' : motivo!,
      );
    },
    async schedule(id, inicio, fim) {
      await pause();
      staff();
      const c = find(id);
      if (!['EM_ANALISE', 'VISITA_AGENDADA'].includes(c.status))
        throw new Error('Inicie a análise antes de agendar.');
      if (new Date(fim) <= new Date(inicio))
        throw new Error('O horário final deve ser posterior ao inicial.');
      c.previsaoVisita = { inicio, fim };
      c.status = 'VISITA_AGENDADA';
      changed(c, 'Visita agendada', 'Uma janela de visita foi informada pela equipe.');
    },
    async link(id, principalId, motivo) {
      await pause();
      staff();
      const c = find(id);
      const p = find(principalId);
      if (
        !activeStatuses.includes(c.status) ||
        !activeStatuses.includes(p.status) ||
        c.id === p.id ||
        p.status === 'RECEBIDO'
      )
        throw new Error('Selecione outro atendimento ativo já em análise.');
      if (!motivo.trim()) throw new Error('Informe o motivo do vínculo.');
      c.status = 'VINCULADO';
      c.previsaoVisita = null;
      c.vinculo = {
        id: p.id,
        protocolo: p.protocolo,
        status: p.status,
        previsaoVisita: copy(p.previsaoVisita),
      };
      changed(
        c,
        'Registro vinculado',
        `Seu relato acompanha o atendimento ${p.protocolo}. ${motivo}`,
      );
    },
    async comment(id, texto, internal) {
      await pause();
      staff();
      const c = find(id);
      if (!texto.trim()) throw new Error('Escreva a mensagem antes de salvar.');
      if (internal) {
        c.observacoesInternas ??= [];
        c.observacoesInternas.push({ id: uid(), texto, criadoEm: now() });
      } else changed(c, 'Atualização da equipe', texto);
    },
  };
}
