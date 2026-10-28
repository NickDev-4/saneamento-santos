import type { Address, Location } from '@/contracts';
export interface ReportValidationInput {
  step: number;
  endereco: Address;
  location: Location;
  tipoId: string;
  descricao: string;
  observadoEm: string;
  imageCount: number;
}
export function validateReportDraft(
  { step, endereco, location, tipoId, descricao, observadoEm, imageCount }: ReportValidationInput,
  now = Date.now(),
): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (endereco.cep.length !== 8) e.cep = 'Informe um CEP com 8 números.';
    if (!endereco.logradouro.trim()) e.logradouro = 'Informe a rua ou avenida.';
    if (!endereco.numero.trim() && !endereco.semNumero)
      e.numero = 'Informe o número ou marque sem número.';
    if (!endereco.bairro.trim()) e.bairro = 'Informe o bairro.';
    if (
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude) ||
      Math.abs(location.latitude) > 90 ||
      Math.abs(location.longitude) > 180
    )
      e.localizacao = 'Confira as coordenadas do ponto.';
  } else if (step === 1) {
    if (!tipoId) e.tipoId = 'Selecione o tipo de problema.';
    if (descricao.trim().length < 15)
      e.descricao = 'Descreva o problema com pelo menos 15 caracteres.';
    if (!observadoEm || Number.isNaN(new Date(observadoEm).getTime()))
      e.observadoEm = 'Informe quando o problema foi observado.';
    else if (new Date(observadoEm).getTime() > now + 60000)
      e.observadoEm = 'A data observada não pode estar no futuro.';
    if (imageCount < 1) e.imagens = 'Adicione pelo menos uma foto do problema.';
  }
  return e;
}
