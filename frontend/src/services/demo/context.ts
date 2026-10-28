import type { Case, CaseInput, Filters, Scope, User } from '@/contracts';
import { activeStatuses } from '@/contracts';
import { createFixtures, demoUsers, noticeFixtures } from '@/mocks/fixtures';

export function createDemoContext() {
  const cases = createFixtures();
  let session: User | null = null;
  let notices = noticeFixtures.map((n) => ({ ...n, recipient: demoUsers.CIDADAO.id }));
  const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 180));
  const now = () => new Date().toISOString();
  const uid = () => crypto.randomUUID();
  const copy = <T>(value: T): T => structuredClone(value);
  function requireUser() {
    if (!session) throw new Error('Entre na sua conta para continuar.');
    return session;
  }
  function staff() {
    if (requireUser().perfil !== 'SABESP')
      throw new Error('Esta ação está disponível para a Sabesp.');
  }
  function find(id: string) {
    const c = cases.find((c) => c.id === id);
    if (!c) throw new Error('Chamado não encontrado.');
    return c;
  }
  function publicCase(c: Case) {
    return c.publicacao === 'APROVADO' && !['VINCULADO', 'CANCELADO'].includes(c.status);
  }
  function actions(c: Case): string[] {
    if (session?.perfil === 'CIDADAO' && c.autor?.id === session.id && c.status === 'RECEBIDO')
      return ['editar', 'cancelar'];
    if (session?.perfil !== 'SABESP') return [];
    const base = ['comentar', 'nota'];
    if (activeStatuses.includes(c.status) && c.status !== 'RECEBIDO')
      base.push('publicar', 'encerrar');
    if (c.status === 'RECEBIDO') base.push('analisar');
    if (c.status === 'EM_ANALISE' || c.status === 'VISITA_AGENDADA') base.push('agendar');
    if (c.status === 'VISITA_AGENDADA') base.push('iniciar');
    if (c.status === 'EM_ATENDIMENTO') base.push('resolver');
    if (['EM_ANALISE', 'VISITA_AGENDADA', 'EM_ATENDIMENTO'].includes(c.status))
      base.push('vincular');
    return base;
  }
  function project(raw: Case, scope: Scope): Case {
    const c = copy(raw);
    c.acoesPermitidas = actions(raw);
    if (scope !== 'staff') {
      delete c.observacoesInternas;
      if (scope === 'public') delete c.autor;
    }
    if (c.vinculo) {
      const p = find(c.vinculo.id);
      c.vinculo = {
        id: p.id,
        protocolo: p.protocolo,
        status: p.status,
        previsaoVisita: copy(p.previsaoVisita),
      };
    }
    return c;
  }
  function permitted(c: Case, scope: Scope) {
    if (scope === 'staff') {
      staff();
      return true;
    }
    return scope === 'public' ? publicCase(c) : requireUser().id === c.autor?.id;
  }
  function matches(c: Case, f: Filters = {}) {
    return (
      (!f.bairro || c.endereco.bairro === f.bairro) &&
      (!f.status || c.status === f.status) &&
      (!f.tipoId || c.tipoId === f.tipoId) &&
      (!f.criadoDe || c.criadoEm.slice(0, 10) >= f.criadoDe) &&
      (!f.criadoAte || c.criadoEm.slice(0, 10) <= f.criadoAte)
    );
  }
  function changed(c: Case, titulo: string, texto: string) {
    c.atualizadoEm = now();
    c.atualizacoes.push({ id: uid(), titulo, texto, criadoEm: now() });
    const recipients = new Set([
      c.autor?.id,
      ...cases.filter((x) => x.vinculo?.id === c.id).map((x) => x.autor?.id),
    ]);
    for (const recipient of recipients)
      if (recipient)
        notices.unshift({
          id: uid(),
          recipient,
          titulo,
          texto: `${c.protocolo}: ${texto}`,
          criadoEm: now(),
          lida: false,
          chamadoId:
            c.autor?.id === recipient
              ? c.id
              : (cases.find((x) => x.autor?.id === recipient && x.vinculo?.id === c.id)?.id ??
                c.id),
        });
  }
  function fileData(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.readAsDataURL(file);
    });
  }
  async function images(input: CaseInput) {
    const uploaded = await Promise.all(
      input.imagens.map(async (file) => ({ id: uid(), url: await fileData(file) })),
    );
    const result = [...copy(input.imagensMantidas), ...uploaded];
    if (result.length < 1 || result.length > 3) throw new Error('Anexe de uma a três fotos.');
    return result;
  }
  return {
    cases,
    get session() {
      return session;
    },
    set session(value: User | null) {
      session = value;
    },
    get notices() {
      return notices;
    },
    set notices(value: typeof notices) {
      notices = value;
    },
    pause,
    now,
    uid,
    copy,
    requireUser,
    staff,
    find,
    publicCase,
    actions,
    project,
    permitted,
    matches,
    changed,
    fileData,
    images,
  };
}

export type DemoContext = ReturnType<typeof createDemoContext>;
