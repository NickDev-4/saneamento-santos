import type { Status } from './cases';

export interface Indicators {
  total: number;
  ativos: number;
  agendados: number;
  resolvidos: number;
  bairros: { nome: string; total: number }[];
  status: { nome: Status; total: number }[];
}
