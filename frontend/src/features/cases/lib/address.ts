import type { Case } from '@/contracts';

export function address(c: Case) {
  return `${c.endereco.logradouro}${c.endereco.semNumero ? ', s/n' : `, ${c.endereco.numero}`}`;
}
