import type { Case } from '@/contracts';

export function address(c: Case) {
  if (c.endereco.semNumero) return `${c.endereco.logradouro}, s/n`;
  return c.endereco.numero
    ? `${c.endereco.logradouro}, ${c.endereco.numero}`
    : c.endereco.logradouro;
}
