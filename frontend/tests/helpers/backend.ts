import type { User } from '../../src/contracts';

import { demoUsers } from '../../src/mocks/fixtures';

import { createFixtures } from '../../src/mocks/fixtures';

import { noticeFixtures } from '../../src/mocks/fixtures';

import type { Case } from '../../src/contracts';

import { activeStatuses } from '../../src/contracts';

import { statusLabels } from '../../src/contracts';

import type { Page } from '@playwright/test';

import type { Role } from '../../src/contracts';

export async function backend(page: Page, role: Role | null = 'CIDADAO') {
  let user: User | null = role ? structuredClone(demoUsers[role]) : null;
  const cases = createFixtures();
  const notices = structuredClone(noticeFixtures);
  const counts = new Map<string, number>();
  const failures = new Map<string, { status: number; message: string }>();
  function project(raw: Case, publicView = false) {
    const item = structuredClone(raw);
    item.acoesPermitidas =
      !publicView && user?.perfil === 'CIDADAO' && item.status === 'RECEBIDO'
        ? ['editar', 'cancelar']
        : [];
    if (publicView || user?.perfil !== 'SABESP') delete item.observacoesInternas;
    if (publicView) delete item.autor;
    return item;
  }
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    const key = `${request.method()} ${path}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    const failure = failures.get(key);
    if (failure)
      return route.fulfill({ status: failure.status, json: { message: failure.message } });
    const json = (data: unknown) => route.fulfill({ json: data });
    const empty = () => route.fulfill({ status: 204 });
    const paged = (items: unknown[]) => json({ items, totalPages: 1 });
    if (path === '/auth/me') return user ? json(user) : route.fulfill({ status: 401, json: {} });
    if (path === '/auth/login') {
      const input = request.postDataJSON();
      user = structuredClone(
        Object.values(demoUsers).find((u) => u.email === input.email) || demoUsers.CIDADAO,
      );
      return json(user);
    }
    if (path === '/auth/logout') {
      user = null;
      return empty();
    }
    if (path === '/me' && request.method() === 'PATCH') {
      user = { ...user!, ...request.postDataJSON() };
      return json(user);
    }
    if (path === '/me/chamados')
      return paged(cases.filter((c) => c.autor?.id === user?.id).map((c) => project(c)));
    if (path === '/operacao/chamados') return paged(cases.map((c) => project(c)));
    if (path === '/public/chamados')
      return paged(cases.filter((c) => c.publicacao === 'APROVADO').map((c) => project(c, true)));
    if (path === '/prefeitura/indicadores') {
      const list = cases.filter((c) => c.publicacao === 'APROVADO');
      return json({
        total: list.length,
        ativos: list.filter((c) => activeStatuses.includes(c.status)).length,
        agendados: list.filter((c) => c.status === 'VISITA_AGENDADA').length,
        resolvidos: list.filter((c) => c.status === 'RESOLVIDO').length,
        bairros: [...new Set(list.map((c) => c.endereco.bairro))].map((nome) => ({
          nome,
          total: list.filter((c) => c.endereco.bairro === nome).length,
        })),
        status: Object.keys(statusLabels)
          .map((nome) => ({ nome, total: list.filter((c) => c.status === nome).length }))
          .filter((s) => s.total),
      });
    }
    if (path === '/me/notificacoes') return paged(notices);
    const read = path.match(/^\/me\/notificacoes\/([^/]+)\/leitura$/);
    if (read) {
      notices.find((n) => n.id === read[1])!.lida = true;
      return empty();
    }
    const cancel = path.match(/^\/chamados\/([^/]+)\/cancelamento$/);
    if (cancel) {
      cases.find((c) => c.id === cancel[1])!.status = 'CANCELADO';
      return empty();
    }
    const notes = path.match(/^\/chamados\/([^/]+)\/observacoes-internas$/);
    if (notes) return json(cases.find((c) => c.id === notes[1])!.observacoesInternas);
    const detail = path.match(/^\/(public\/)?chamados\/([^/]+)$/);
    if (detail)
      return json(
        project(
          cases.find((c) => c.id === detail[2])!,
          Boolean(detail[1]),
        ),
      );
    return route.fulfill({
      status: 404,
      json: { message: `Endpoint inesperado no teste: ${key}` },
    });
  });
  return { counts, failures };
}
