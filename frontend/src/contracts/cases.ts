import type { Address, Location } from './address';
import type { User } from './auth';

export type Status =
  | 'RECEBIDO'
  | 'EM_ANALISE'
  | 'VISITA_AGENDADA'
  | 'EM_ATENDIMENTO'
  | 'RESOLVIDO'
  | 'VINCULADO'
  | 'ENCERRADO_SEM_ATENDIMENTO'
  | 'CANCELADO';

export type Scope = 'public' | 'mine' | 'staff';

export interface Image {
  id: string;
  url: string;
  ilustrativa?: boolean;
}

export interface Update {
  id: string;
  texto: string;
  criadoEm: string;
  titulo?: string;
}

export interface Case {
  id: string;
  protocolo: string;
  tipoId: string;
  tipo: string;
  descricao: string;
  observadoEm: string;
  criadoEm: string;
  atualizadoEm: string;
  endereco: Address;
  localizacao: Location;
  status: Status;
  publicacao: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  imagens: Image[];
  previsaoVisita: { inicio: string; fim: string } | null;
  atualizacoes: Update[];
  observacoesInternas?: Update[];
  autor?: User;
  vinculo?: {
    id: string;
    protocolo: string;
    status: Status;
    previsaoVisita: Case['previsaoVisita'];
  };
  reincidenciaDe?: string | null;
  motivoEncerramento?: string;
  acoesPermitidas: string[];
}

export interface CaseInput {
  tipoId: string;
  descricao: string;
  observadoEm: string;
  endereco: Address;
  localizacao: Location;
  imagens: File[];
  imagensMantidas: Image[];
  reincidenciaDe?: string | null;
}

export interface Filters {
  bairro?: string;
  status?: string;
  tipoId?: string;
  criadoDe?: string;
  criadoAte?: string;
}

export const statusLabels: Record<Status, string> = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em análise',
  VISITA_AGENDADA: 'Visita agendada',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDO: 'Resolvido',
  VINCULADO: 'Vinculado',
  ENCERRADO_SEM_ATENDIMENTO: 'Encerrado sem atendimento',
  CANCELADO: 'Cancelado',
};

export const typeOptions = [
  { id: 'extravasamento', nome: 'Extravasamento de esgoto' },
  { id: 'retorno', nome: 'Retorno de esgoto' },
  { id: 'odor', nome: 'Odor forte' },
];

export const activeStatuses: Status[] = [
  'RECEBIDO',
  'EM_ANALISE',
  'VISITA_AGENDADA',
  'EM_ATENDIMENTO',
];
