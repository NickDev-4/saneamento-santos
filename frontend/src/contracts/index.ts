export type Role = 'CIDADAO' | 'SABESP' | 'PREFEITURA';
export type Status = 'RECEBIDO' | 'EM_ANALISE' | 'VISITA_AGENDADA' | 'EM_ATENDIMENTO' | 'RESOLVIDO' | 'VINCULADO' | 'ENCERRADO_SEM_ATENDIMENTO' | 'CANCELADO';
export type Scope = 'public' | 'mine' | 'staff';
export interface User { id: string; nome: string; email: string; telefone?: string; perfil: Role }
export interface Address { cep: string; logradouro: string; numero: string; semNumero: boolean; bairro: string; cidade: string; uf: string; referencia: string }
export interface Location { latitude: number; longitude: number }
export interface Image { id: string; url: string; ilustrativa?: boolean }
export interface Update { id: string; texto: string; criadoEm: string; titulo?: string }
export interface Case {
  id: string; protocolo: string; tipoId: string; tipo: string; descricao: string;
  observadoEm: string; criadoEm: string; atualizadoEm: string; endereco: Address;
  localizacao: Location; status: Status; publicacao: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  imagens: Image[]; previsaoVisita: { inicio: string; fim: string } | null;
  atualizacoes: Update[]; observacoesInternas?: Update[]; autor?: User;
  vinculo?: { id: string; protocolo: string; status: Status; previsaoVisita: Case['previsaoVisita'] };
  reincidenciaDe?: string | null; motivoEncerramento?: string; acoesPermitidas: string[];
}
export interface CaseInput {
  tipoId: string; descricao: string; observadoEm: string; endereco: Address;
  localizacao: Location; imagens: File[]; imagensMantidas: Image[]; reincidenciaDe?: string | null;
}
export interface Notice { id: string; titulo: string; texto: string; criadoEm: string; lida: boolean; chamadoId: string }
export interface Filters { bairro?: string; status?: string; tipoId?: string; criadoDe?: string; criadoAte?: string }
export interface Indicators { total: number; ativos: number; agendados: number; resolvidos: number; bairros: { nome: string; total: number }[]; status: { nome: Status; total: number }[] }
export interface Api {
  types(): Promise<{ id: string; nome: string }[]>;
  me(): Promise<User | null>;
  login(input: { email?: string; senha?: string; perfilDemo?: Role }): Promise<User>;
  signup(input: { nome: string; email: string; senha: string; telefone?: string }): Promise<User>;
  logout(): Promise<void>; recover(email: string): Promise<void>; updateProfile(input: Partial<User>): Promise<User>;
  list(scope: Scope, filters?: Filters): Promise<Case[]>; detail(id: string, scope: Scope): Promise<Case>;
  save(input: CaseInput, id?: string): Promise<Case>; cancel(id: string): Promise<void>;
  transition(id: string, status: Status, texto?: string, foto?: File): Promise<void>;
  publish(id: string, approved: boolean, motivo?: string): Promise<void>;
  schedule(id: string, inicio: string, fim: string): Promise<void>;
  link(id: string, principalId: string, motivo: string): Promise<void>;
  comment(id: string, texto: string, internal: boolean): Promise<void>;
  notices(): Promise<Notice[]>; markRead(id: string): Promise<void>;
  address(cep: string): Promise<Partial<Address>>; geocode(address: Address): Promise<Location>;
  indicators(filters?: Filters): Promise<Indicators>;
}
export const statusLabels: Record<Status, string> = {
  RECEBIDO: 'Recebido', EM_ANALISE: 'Em análise', VISITA_AGENDADA: 'Visita agendada',
  EM_ATENDIMENTO: 'Em atendimento', RESOLVIDO: 'Resolvido', VINCULADO: 'Vinculado',
  ENCERRADO_SEM_ATENDIMENTO: 'Encerrado sem atendimento', CANCELADO: 'Cancelado',
};
export const typeOptions = [
  { id: 'extravasamento', nome: 'Extravasamento de esgoto' },
  { id: 'retorno', nome: 'Retorno de esgoto' },
  { id: 'odor', nome: 'Odor forte' },
];
export const activeStatuses: Status[] = ['RECEBIDO', 'EM_ANALISE', 'VISITA_AGENDADA', 'EM_ATENDIMENTO'];
export const roleLabels: Record<Role, string> = { CIDADAO: 'Cidadão', SABESP: 'Sabesp', PREFEITURA: 'Prefeitura' };
