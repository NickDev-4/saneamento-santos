import type { Api, Case, CaseInput, Filters, Notice, User } from '../contracts';
import { ApiError } from './api-error';

const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const csrf = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.slice(11);
  if (csrf && init.method && init.method !== 'GET') headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf));
  let response: Response;
  try { response = await fetch(`${base}${path}`, { ...init, headers, credentials: 'include' }); }
  catch { throw new ApiError('Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.', 0); }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.message || (response.status === 401 ? 'Sua sessão terminou. Entre novamente.' : 'Não foi possível concluir esta ação.'), response.status, error.fieldErrors);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
const json = (body: unknown) => JSON.stringify(body);
function query(filters: Filters = {}) { const q = new URLSearchParams(); Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); }); return q; }
async function pages<T>(path: string, filters?: Filters): Promise<T[]> {
  const q = query(filters); q.set('size', '100');
  const items: T[] = [];
  for (let page = 0; page < 100; page++) {
    q.set('page', String(page));
    const result = await request<{ items: T[]; totalPages: number }>(`${path}?${q}`);
    items.push(...result.items);
    if (page + 1 >= result.totalPages) return items;
  }
  throw new Error('Há muitos resultados nesta consulta. Reduza a área ou aplique filtros.');
}
function form(input: CaseInput) {
  const data = new FormData();
  const { imagens, imagensMantidas, ...dados } = input;
  data.append('dados', new Blob([json(dados)], { type: 'application/json' }));
  data.append('imagensMantidas', new Blob([json(imagensMantidas.map(i => i.id))], { type: 'application/json' }));
  imagens.forEach(file => data.append('imagens', file));
  return data;
}
export const httpApi: Api = {
  types: () => request('/public/tipos-chamado'),
  async me() { try { return await request<User>('/auth/me'); } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; } },
  login: input => request('/auth/login', { method: 'POST', body: json({ email: input.email, senha: input.senha }) }),
  async signup(input) { await request('/auth/cadastro', { method: 'POST', body: json(input) }); return this.login({ email: input.email, senha: input.senha }); },
  logout: () => request('/auth/logout', { method: 'POST' }),
  recover: email => request('/auth/recuperacao', { method: 'POST', body: json({ email }) }),
  updateProfile: input => request('/me', { method: 'PATCH', body: json({ nome: input.nome, telefone: input.telefone }) }),
  list: (scope, filters) => pages<Case>(scope === 'staff' ? '/operacao/chamados' : scope === 'mine' ? '/me/chamados' : '/public/chamados', filters),
  async detail(id, scope) {
    const c = await request<Case>(`${scope === 'public' ? '/public' : ''}/chamados/${encodeURIComponent(id)}`);
    if (scope === 'staff') c.observacoesInternas = await request(`/chamados/${encodeURIComponent(id)}/observacoes-internas`);
    return c;
  },
  save: (input, id) => request(id ? `/chamados/${encodeURIComponent(id)}` : '/chamados', { method: id ? 'PATCH' : 'POST', body: form(input) }),
  cancel: id => request(`/chamados/${encodeURIComponent(id)}/cancelamento`, { method: 'POST' }),
  transition: (id, status, texto, foto) => { const body = new FormData(); body.append('dados', new Blob([json({ status, comentarioPublico: texto })], { type: 'application/json' })); if (foto) body.append('imagemResolucao', foto); return request(`/chamados/${encodeURIComponent(id)}/status`, { method: 'PATCH', body }); },
  publish: (id, approved, motivo) => request(`/chamados/${encodeURIComponent(id)}/publicacao`, { method: 'PATCH', body: json({ publicacao: approved ? 'APROVADO' : 'REJEITADO', justificativa: motivo }) }),
  schedule: (id, inicio, fim) => request(`/chamados/${encodeURIComponent(id)}/previsao`, { method: 'PATCH', body: json({ inicio, fim }) }),
  link: (id, principalId, motivo) => request(`/chamados/${encodeURIComponent(id)}/vinculo`, { method: 'POST', body: json({ chamadoPrincipalId: principalId, justificativa: motivo }) }),
  comment: (id, texto, internal) => request(`/chamados/${encodeURIComponent(id)}/${internal ? 'observacoes-internas' : 'atualizacoes-publicas'}`, { method: 'POST', body: json({ texto }) }),
  notices: () => pages<Notice>('/me/notificacoes'),
  markRead: id => request(`/me/notificacoes/${encodeURIComponent(id)}/leitura`, { method: 'PATCH' }),
  address: cep => request(`/enderecos/cep/${encodeURIComponent(cep)}`),
  geocode: endereco => request('/enderecos/geocodificacao', { method: 'POST', body: json({ endereco }) }),
  indicators: filters => request(`/prefeitura/indicadores?${query(filters)}`),
};
