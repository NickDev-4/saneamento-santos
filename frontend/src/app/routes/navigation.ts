import type { Role } from '@/contracts';

export function homeFor(role: Role) {
  return role === 'SABESP' ? '/sabesp' : role === 'PREFEITURA' ? '/prefeitura' : '/meus-chamados';
}
