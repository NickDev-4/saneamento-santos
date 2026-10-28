export type Role = 'CIDADAO' | 'SABESP' | 'PREFEITURA';

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: Role;
}

export const roleLabels: Record<Role, string> = {
  CIDADAO: 'Cidadão',
  SABESP: 'Sabesp',
  PREFEITURA: 'Prefeitura',
};
