import type { Status } from '@/contracts';
export const publicStatuses: Status[] = [
	'RECEBIDO',
  'EM_ANALISE',
  'VISITA_AGENDADA',
  'EM_ATENDIMENTO',
  'RESOLVIDO',
	'ENCERRADO_SEM_ATENDIMENTO',
];

export const finalizedStatuses: Status[] = ['RESOLVIDO', 'ENCERRADO_SEM_ATENDIMENTO'];
export const activePublicStatuses = publicStatuses.filter((status) => !finalizedStatuses.includes(status));
export const finalizedFilterValue = 'FINALIZADOS';
export const allStatusesFilterValue = 'TODOS';
