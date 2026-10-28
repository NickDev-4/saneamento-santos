export function date(value: string, time = false) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}
