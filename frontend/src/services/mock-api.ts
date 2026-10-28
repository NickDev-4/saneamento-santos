// Simulador de respostas para a interface. Sem banco, persistência ou autenticação real.
// As validações definitivas e todas as operações reais pertencem à API Java.
import type { Api, Case, CaseInput, Filters, Notice, Scope, Status, User } from '../contracts';
import { activeStatuses, statusLabels, typeOptions } from '../contracts';
import { createFixtures, demoUsers, noticeFixtures } from '../mocks/fixtures';

const cases = createFixtures();
let session: User | null = null;
let notices = noticeFixtures.map(n => ({ ...n, recipient: demoUsers.CIDADAO.id }));
const pause = () => new Promise<void>(resolve => setTimeout(resolve, 180));
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const copy = <T,>(value: T): T => structuredClone(value);
function requireUser() { if (!session) throw new Error('Entre na sua conta para continuar.'); return session; }
function staff() { if (requireUser().perfil !== 'SABESP') throw new Error('Esta ação está disponível para a Sabesp.'); }
function find(id: string) { const c = cases.find(c => c.id === id); if (!c) throw new Error('Chamado não encontrado.'); return c; }
function publicCase(c: Case) { return c.publicacao === 'APROVADO' && !['VINCULADO', 'CANCELADO'].includes(c.status); }
function actions(c: Case): string[] {
  if (session?.perfil === 'CIDADAO' && c.autor?.id === session.id && c.status === 'RECEBIDO') return ['editar', 'cancelar'];
  if (session?.perfil !== 'SABESP') return [];
  const base = ['comentar', 'nota'];
  if (activeStatuses.includes(c.status) && c.status !== 'RECEBIDO') base.push('publicar', 'encerrar');
  if (c.status === 'RECEBIDO') base.push('analisar');
  if (c.status === 'EM_ANALISE' || c.status === 'VISITA_AGENDADA') base.push('agendar');
  if (c.status === 'VISITA_AGENDADA') base.push('iniciar');
  if (c.status === 'EM_ATENDIMENTO') base.push('resolver');
  if (['EM_ANALISE', 'VISITA_AGENDADA', 'EM_ATENDIMENTO'].includes(c.status)) base.push('vincular');
  return base;
}
function project(raw: Case, scope: Scope): Case {
  const c = copy(raw);
  c.acoesPermitidas = actions(raw);
  if (scope !== 'staff') { delete c.observacoesInternas; if (scope === 'public') delete c.autor; }
  if (c.vinculo) {
    const p = find(c.vinculo.id);
    c.vinculo = { id: p.id, protocolo: p.protocolo, status: p.status, previsaoVisita: copy(p.previsaoVisita) };
  }
  return c;
}
function permitted(c: Case, scope: Scope) {
  if (scope === 'staff') { staff(); return true; }
  return scope === 'public' ? publicCase(c) : requireUser().id === c.autor?.id;
}
function matches(c: Case, f: Filters = {}) {
  return (!f.bairro || c.endereco.bairro === f.bairro) && (!f.status || c.status === f.status) && (!f.tipoId || c.tipoId === f.tipoId)
    && (!f.criadoDe || c.criadoEm.slice(0, 10) >= f.criadoDe) && (!f.criadoAte || c.criadoEm.slice(0, 10) <= f.criadoAte);
}
function changed(c: Case, titulo: string, texto: string) {
  c.atualizadoEm = now();
  c.atualizacoes.push({ id: uid(), titulo, texto, criadoEm: now() });
  const recipients = new Set([c.autor?.id, ...cases.filter(x => x.vinculo?.id === c.id).map(x => x.autor?.id)]);
  for (const recipient of recipients) if (recipient) notices.unshift({ id: uid(), recipient, titulo, texto: `${c.protocolo}: ${texto}`, criadoEm: now(), lida: false, chamadoId: c.autor?.id === recipient ? c.id : cases.find(x => x.autor?.id === recipient && x.vinculo?.id === c.id)?.id ?? c.id });
}
function fileData(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Não foi possível ler a imagem.')); reader.readAsDataURL(file); });
}
async function images(input: CaseInput) {
  const uploaded = await Promise.all(input.imagens.map(async file => ({ id: uid(), url: await fileData(file) })));
  const result = [...copy(input.imagensMantidas), ...uploaded];
  if (result.length < 1 || result.length > 3) throw new Error('Anexe de uma a três fotos.');
  return result;
}
export const mockApi: Api = {
  async types() { return copy(typeOptions); },
  async me() { await pause(); return copy(session); },
  async login(input) { await pause(); session = copy(demoUsers[input.perfilDemo ?? 'CIDADAO']); return copy(session); },
  async signup(input) { await pause(); session = { id: uid(), nome: input.nome, email: input.email, telefone: input.telefone, perfil: 'CIDADAO' }; return copy(session); },
  async logout() { session = null; },
  async recover() { await pause(); },
  async updateProfile(input) { await pause(); session = { ...requireUser(), nome: input.nome ?? requireUser().nome, telefone: input.telefone ?? requireUser().telefone }; return copy(session); },
  async list(scope, filters) { await pause(); return cases.filter(c => permitted(c, scope) && matches(c, filters)).map(c => project(c, scope)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)); },
  async detail(id, scope) { await pause(); const c = find(id); if (!permitted(c, scope)) throw new Error('Este chamado não está disponível para esta conta.'); return project(c, scope); },
  async save(input, id) {
    await pause(); const user = requireUser(); if (user.perfil !== 'CIDADAO') throw new Error('Use uma conta de cidadão para registrar.');
    const imgs = await images(input);
    const tipo = typeOptions.find(t => t.id === input.tipoId)?.nome ?? 'Problema de esgoto';
    if (id) {
      const c = find(id);
      if (c.autor?.id !== user.id || c.status !== 'RECEBIDO') throw new Error('Este registro já está em análise e não pode mais ser editado.');
      Object.assign(c, { tipo, tipoId: input.tipoId, descricao: input.descricao, observadoEm: input.observadoEm, endereco: copy(input.endereco), localizacao: copy(input.localizacao), imagens: imgs, atualizadoEm: now() });
      return project(c, 'mine');
    }
    const c: Case = { id: uid(), protocolo: `DEMO-${150 + cases.length}`, tipoId: input.tipoId, tipo, descricao: input.descricao, observadoEm: input.observadoEm, criadoEm: now(), atualizadoEm: now(), endereco: copy(input.endereco), localizacao: copy(input.localizacao), imagens: imgs, status: 'RECEBIDO', publicacao: 'PENDENTE', previsaoVisita: null, autor: copy(user), atualizacoes: [{ id: uid(), titulo: 'Chamado recebido', texto: 'Seu relato aguarda validação da equipe.', criadoEm: now() }], observacoesInternas: [], acoesPermitidas: [], reincidenciaDe: input.reincidenciaDe };
    cases.unshift(c); return project(c, 'mine');
  },
  async cancel(id) { await pause(); const c = find(id); if (c.autor?.id !== requireUser().id || c.status !== 'RECEBIDO') throw new Error('O cancelamento está disponível apenas antes da análise.'); c.status = 'CANCELADO'; changed(c, 'Chamado cancelado', 'Registro cancelado pelo autor.'); },
  async transition(id, status, texto, foto) {
    await pause(); staff(); const c = find(id);
    const next: Partial<Record<Status, Status>> = { RECEBIDO: 'EM_ANALISE', VISITA_AGENDADA: 'EM_ATENDIMENTO', EM_ATENDIMENTO: 'RESOLVIDO' };
    if (status === 'ENCERRADO_SEM_ATENDIMENTO') { if (!activeStatuses.includes(c.status) || !texto?.trim()) throw new Error('Informe a justificativa de encerramento.'); }
    else if (next[c.status] !== status) throw new Error('A situação do chamado mudou. Atualize a página.');
    if (status === 'RESOLVIDO' && !texto?.trim()) throw new Error('Descreva a solução realizada.');
    if (foto) c.imagens.push({ id: uid(), url: await fileData(foto) });
    c.status = status; if (status === 'ENCERRADO_SEM_ATENDIMENTO') { c.motivoEncerramento = texto; c.previsaoVisita = null; }
    changed(c, statusLabels[status], texto || `Atendimento atualizado para ${statusLabels[status].toLowerCase()}.`);
  },
  async publish(id, approved, motivo) { await pause(); staff(); const c = find(id); if (!activeStatuses.includes(c.status)) throw new Error('Este atendimento está encerrado.'); if (!approved && !motivo?.trim()) throw new Error('Informe o motivo.'); c.publicacao = approved ? 'APROVADO' : 'REJEITADO'; changed(c, approved ? 'Publicação aprovada' : 'Publicação não aprovada', approved ? 'O relato está disponível no mapa público.' : motivo!); },
  async schedule(id, inicio, fim) { await pause(); staff(); const c = find(id); if (!['EM_ANALISE', 'VISITA_AGENDADA'].includes(c.status)) throw new Error('Inicie a análise antes de agendar.'); if (new Date(fim) <= new Date(inicio)) throw new Error('O horário final deve ser posterior ao inicial.'); c.previsaoVisita = { inicio, fim }; c.status = 'VISITA_AGENDADA'; changed(c, 'Visita agendada', 'Uma janela de visita foi informada pela equipe.'); },
  async link(id, principalId, motivo) { await pause(); staff(); const c = find(id); const p = find(principalId); if (!activeStatuses.includes(c.status) || !activeStatuses.includes(p.status) || c.id === p.id || p.status === 'RECEBIDO') throw new Error('Selecione outro atendimento ativo já em análise.'); if (!motivo.trim()) throw new Error('Informe o motivo do vínculo.'); c.status = 'VINCULADO'; c.previsaoVisita = null; c.vinculo = { id: p.id, protocolo: p.protocolo, status: p.status, previsaoVisita: copy(p.previsaoVisita) }; changed(c, 'Registro vinculado', `Seu relato acompanha o atendimento ${p.protocolo}. ${motivo}`); },
  async comment(id, texto, internal) { await pause(); staff(); const c = find(id); if (!texto.trim()) throw new Error('Escreva a mensagem antes de salvar.'); if (internal) { c.observacoesInternas ??= []; c.observacoesInternas.push({ id: uid(), texto, criadoEm: now() }); } else changed(c, 'Atualização da equipe', texto); },
  async notices(): Promise<Notice[]> { await pause(); const id = requireUser().id; return copy(notices.filter(n => n.recipient === id)).map(({ recipient: _, ...n }) => n); },
  async markRead(id) { const n = notices.find(n => n.id === id && n.recipient === requireUser().id); if (n) n.lida = true; },
  async address(cep) { await pause(); if (cep === '00000000') throw new Error('CEP não encontrado. Você pode preencher o endereço manualmente.'); return { cep, logradouro: 'Avenida Ana Costa', bairro: 'Gonzaga', cidade: 'Santos', uf: 'SP' }; },
  async geocode() { await pause(); return { latitude: -23.9652, longitude: -46.3343 }; },
  async indicators(filters) {
    await pause(); if (requireUser().perfil !== 'PREFEITURA') throw new Error('Acesso reservado à Prefeitura.');
    const all = cases.filter(c => publicCase(c) && matches(c, filters));
    const bairros = [...new Set(all.map(c => c.endereco.bairro))].map(nome => ({ nome, total: all.filter(c => c.endereco.bairro === nome).length })).sort((a, b) => b.total - a.total);
    return { total: all.length, ativos: all.filter(c => activeStatuses.includes(c.status)).length, agendados: all.filter(c => c.status === 'VISITA_AGENDADA').length, resolvidos: all.filter(c => c.status === 'RESOLVIDO').length, bairros, status: (Object.keys(statusLabels) as Status[]).map(nome => ({ nome, total: all.filter(c => c.status === nome).length })).filter(s => s.total) };
  },
};
