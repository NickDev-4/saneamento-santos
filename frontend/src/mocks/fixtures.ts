import type { Case, Notice, Role, User } from '../contracts';

export const demoUsers: Record<Role, User> = {
  CIDADAO: { id: 'moradora-demo', nome: 'Marina Costa', email: 'marina@exemplo.test', telefone: '(13) 99999-0000', perfil: 'CIDADAO' },
  SABESP: { id: 'sabesp-demo', nome: 'Equipe de atendimento', email: 'equipe@exemplo.test', perfil: 'SABESP' },
  PREFEITURA: { id: 'prefeitura-demo', nome: 'Gestão municipal', email: 'gestao@exemplo.test', perfil: 'PREFEITURA' },
};
const other: User = { id: 'outro-demo', nome: 'Morador de demonstração', email: 'morador@exemplo.test', perfil: 'CIDADAO' };
export function createFixtures(): Case[] {
  const rows: [string, string, string, string, number, number, Case['status'], string][] = [
    ['142', 'Rua Frei Francisco Sampaio', '210', 'Aparecida', -23.9751, -46.3078, 'VISITA_AGENDADA', 'extravasamento'],
    ['141', 'Rua Azevedo Sodré', '82', 'Boqueirão', -23.9712, -46.3263, 'EM_ATENDIMENTO', 'retorno'],
    ['140', 'Avenida Ana Costa', '433', 'Gonzaga', -23.9652, -46.3343, 'EM_ANALISE', 'odor'],
    ['139', 'Rua Carlos Afonseca', '75', 'Gonzaga', -23.9692, -46.3316, 'RESOLVIDO', 'extravasamento'],
    ['138', 'Avenida Conselheiro Nébias', '610', 'Embaré', -23.9645, -46.3222, 'VISITA_AGENDADA', 'retorno'],
    ['137', 'Rua Oswaldo Cochrane', '95', 'Embaré', -23.974, -46.3153, 'EM_ANALISE', 'extravasamento'],
    ['143', 'Rua Alexandre Martins', '48', 'Aparecida', -23.9774, -46.3073, 'RECEBIDO', 'odor'],
    ['144', 'Rua Frei Francisco Sampaio', '212', 'Aparecida', -23.975, -46.3077, 'VINCULADO', 'extravasamento'],
  ];
  return rows.map(([id, rua, numero, bairro, latitude, longitude, status, tipoId], i) => {
    const criadoEm = `2026-10-${String(28 - (i % 4)).padStart(2, '0')}T09:20:00-03:00`;
    const scheduled = status === 'VISITA_AGENDADA';
    return {
      id, protocolo: `SS-2026-0${id}`, tipoId,
      tipo: tipoId === 'odor' ? 'Odor forte' : tipoId === 'retorno' ? 'Retorno de esgoto' : 'Extravasamento de esgoto',
      descricao: tipoId === 'odor' ? 'Odor forte próximo à rede de esgoto neste trecho da rua. O local foi indicado no mapa para avaliação da equipe.' : tipoId === 'retorno' ? 'Foi observado retorno de esgoto junto à calçada. O problema está próximo ao ponto indicado e precisa de avaliação.' : 'Água de esgoto saindo pela tampa de inspeção e acumulando junto à calçada. A passagem de pedestres está prejudicada.',
      observadoEm: criadoEm, criadoEm, atualizadoEm: '2026-10-28T10:40:00-03:00',
      endereco: { cep: '11055000', logradouro: rua, numero, semNumero: false, bairro, cidade: 'Santos', uf: 'SP', referencia: 'Trecho indicado no mapa. Endereço utilizado em cenário fictício.' },
      localizacao: { latitude, longitude }, status, publicacao: i < 6 ? 'APROVADO' : 'PENDENTE',
      imagens: [{ id: `foto-${id}`, url: '/cenario-esgoto.svg', ilustrativa: true }],
      previsaoVisita: scheduled ? { inicio: '2026-10-29T08:00:00-03:00', fim: '2026-10-29T12:00:00-03:00' } : null,
      atualizacoes: [
        { id: `u-${id}-1`, titulo: 'Chamado recebido', texto: 'Registro recebido e encaminhado para análise.', criadoEm },
        ...(i < 6 ? [{ id: `u-${id}-2`, titulo: 'Relato validado', texto: 'O relato foi validado e está disponível para acompanhamento.', criadoEm: '2026-10-28T09:45:00-03:00' }] : []),
        ...(scheduled ? [{ id: `u-${id}-3`, titulo: 'Visita agendada', texto: 'A equipe fará a visita em 29 de outubro, entre 8h e 12h.', criadoEm: '2026-10-28T10:40:00-03:00' }] : []),
        ...(status === 'RESOLVIDO' ? [{ id: `u-${id}-4`, titulo: 'Problema resolvido', texto: 'A equipe concluiu a desobstrução e verificou o funcionamento da rede.', criadoEm: '2026-10-28T11:00:00-03:00' }] : []),
      ],
      observacoesInternas: [{ id: `n-${id}`, texto: 'Cenário de avaliação: conferir o ponto de inspeção durante a visita.', criadoEm }],
      autor: [0, 6, 7].includes(i) ? { ...demoUsers.CIDADAO } : { ...other },
      acoesPermitidas: [],
      ...(status === 'VINCULADO' ? { vinculo: { id: '142', protocolo: 'SS-2026-0142', status: 'VISITA_AGENDADA' as const, previsaoVisita: { inicio: '2026-10-29T08:00:00-03:00', fim: '2026-10-29T12:00:00-03:00' } } } : {}),
    };
  });
}
export const noticeFixtures: Notice[] = [
  { id: 'aviso-1', titulo: 'Sua visita foi agendada', texto: 'Acompanhe a janela de visita do chamado SS-2026-0142.', criadoEm: '2026-10-28T10:40:00-03:00', lida: false, chamadoId: '142' },
  { id: 'aviso-2', titulo: 'Seu registro foi vinculado', texto: 'O mesmo problema já é acompanhado pelo chamado SS-2026-0142. Seu relato permanece no histórico.', criadoEm: '2026-10-28T10:00:00-03:00', lida: false, chamadoId: '144' },
];
