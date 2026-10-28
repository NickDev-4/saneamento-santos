import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Case, Role, User } from '../../src/contracts';
import { activeStatuses, statusLabels } from '../../src/contracts';
import { createFixtures, demoUsers, noticeFixtures } from '../../src/mocks/fixtures';

// Respostas HTTP controladas: exercita as telas, os providers e o adapter HTTP,
// sem exigir ou implementar um servidor Java para estes testes.
async function backend(page: Page, role: Role = 'CIDADAO') {
  let user: User | null = structuredClone(demoUsers[role]);
  const cases = createFixtures();
  const notices = structuredClone(noticeFixtures);
  const counts = new Map<string, number>();
  const failures = new Map<string, { status: number; message: string }>();
  function project(raw: Case, publicView = false) {
    const item = structuredClone(raw);
    item.acoesPermitidas = !publicView && user?.perfil === 'CIDADAO' && item.status === 'RECEBIDO' ? ['editar', 'cancelar'] : [];
    if (publicView || user?.perfil !== 'SABESP') delete item.observacoesInternas;
    if (publicView) delete item.autor;
    return item;
  }
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    const key = `${request.method()} ${path}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    const failure = failures.get(key);
    if (failure) return route.fulfill({ status: failure.status, json: { message: failure.message } });
    const json = (data: unknown) => route.fulfill({ json: data });
    const empty = () => route.fulfill({ status: 204 });
    const paged = (items: unknown[]) => json({ items, totalPages: 1 });
    if (path === '/auth/me') return user ? json(user) : route.fulfill({ status: 401, json: {} });
    if (path === '/auth/login') {
      const input = request.postDataJSON();
      user = structuredClone(Object.values(demoUsers).find(u => u.email === input.email) || demoUsers.CIDADAO);
      return json(user);
    }
    if (path === '/auth/logout') { user = null; return empty(); }
    if (path === '/me' && request.method() === 'PATCH') {
      user = { ...user!, ...request.postDataJSON() }; return json(user);
    }
    if (path === '/me/chamados') return paged(cases.filter(c => c.autor?.id === user?.id).map(c => project(c)));
    if (path === '/operacao/chamados') return paged(cases.map(c => project(c)));
    if (path === '/public/chamados') return paged(cases.filter(c => c.publicacao === 'APROVADO').map(c => project(c, true)));
    if (path === '/prefeitura/indicadores') {
      const list = cases.filter(c => c.publicacao === 'APROVADO');
      return json({
        total: list.length, ativos: list.filter(c => activeStatuses.includes(c.status)).length,
        agendados: list.filter(c => c.status === 'VISITA_AGENDADA').length,
        resolvidos: list.filter(c => c.status === 'RESOLVIDO').length,
        bairros: [...new Set(list.map(c => c.endereco.bairro))].map(nome => ({ nome, total: list.filter(c => c.endereco.bairro === nome).length })),
        status: Object.keys(statusLabels).map(nome => ({ nome, total: list.filter(c => c.status === nome).length })).filter(s => s.total),
      });
    }
    if (path === '/me/notificacoes') return paged(notices);
    const read = path.match(/^\/me\/notificacoes\/([^/]+)\/leitura$/);
    if (read) { notices.find(n => n.id === read[1])!.lida = true; return empty(); }
    const cancel = path.match(/^\/chamados\/([^/]+)\/cancelamento$/);
    if (cancel) { cases.find(c => c.id === cancel[1])!.status = 'CANCELADO'; return empty(); }
    const notes = path.match(/^\/chamados\/([^/]+)\/observacoes-internas$/);
    if (notes) return json(cases.find(c => c.id === notes[1])!.observacoesInternas);
    const detail = path.match(/^\/(public\/)?chamados\/([^/]+)$/);
    if (detail) return json(project(cases.find(c => c.id === detail[2])!, Boolean(detail[1])));
    return route.fulfill({ status: 404, json: { message: `Endpoint inesperado no teste: ${key}` } });
  });
  return { counts, failures };
}

test('cancelar atualiza detalhe e lista previamente consultada', async ({ page }) => {
  const { counts } = await backend(page);
  await page.goto('/meus-chamados');
  await page.getByRole('link').filter({ hasText: 'SS-2026-0143' }).click();
  await page.getByRole('button', { name: 'Cancelar chamado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar cancelamento' }).click();
  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar chamado', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Meus chamados', exact: true }).click();
  await expect(page.getByRole('link').filter({ hasText: 'SS-2026-0143' })).toContainText('Cancelado');
  expect(counts.get('GET /me/chamados')).toBe(2);
});

test('ler notificação atualiza somente avisos e reaproveita lista de chamados', async ({ page }) => {
  const { counts } = await backend(page);
  await page.goto('/meus-chamados');
  await expect(page.getByText('SS-2026-0143')).toBeVisible();
  await page.getByRole('link', { name: 'Avisos', exact: true }).click();
  await page.getByRole('button', { name: 'Marcar como lida' }).first().click();
  await expect(page.getByRole('button', { name: 'Marcar como lida' })).toHaveCount(1);
  await page.getByRole('link', { name: 'Chamados', exact: true }).click();
  await expect(page.getByText('SS-2026-0143')).toBeVisible();
  expect(counts.get('GET /me/notificacoes')).toBe(2);
  expect(counts.get('GET /me/chamados')).toBe(1);
});

test('erro de consulta permite nova tentativa sem recarregar a página', async ({ page }) => {
  const { failures } = await backend(page);
  failures.set('GET /me/chamados', { status: 503, message: 'Serviço temporariamente indisponível' });
  await page.goto('/meus-chamados');
  await expect(page.getByText('Serviço temporariamente indisponível')).toBeVisible();
  failures.clear();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('SS-2026-0143')).toBeVisible();
});

test('401 remove sessão e impede reutilizar os dados privados', async ({ page }) => {
  const { failures, counts } = await backend(page);
  await page.goto('/meus-chamados');
  await expect(page.getByText('SS-2026-0143')).toBeVisible();
  failures.set('GET /me/notificacoes', { status: 401, message: 'Sessão expirada' });
  await page.getByRole('link', { name: 'Avisos', exact: true }).click();
  await expect(page).toHaveURL(/\/entrar\?retorno=/);
  await expect(page.getByRole('link', { name: 'Entrar na conta', exact: true })).toBeVisible();
  await expect(page.getByText('SS-2026-0143')).toHaveCount(0);
  expect(counts.get('GET /me/notificacoes')).toBe(1);
});

test('editar perfil propaga o usuário e sair limpa a sessão', async ({ page }) => {
  await backend(page);
  await page.goto('/perfil');
  await page.getByRole('button', { name: /Editar perfil/ }).click();
  await page.getByLabel('Nome completo').fill('Marina de Santos');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('heading', { name: 'Marina de Santos' })).toBeVisible();
  await page.getByRole('button', { name: /Sair da conta/ }).click();
  await expect(page).toHaveURL(/\/entrar\?retorno=/);
  await expect(page.getByRole('link', { name: 'Entrar na conta', exact: true })).toBeVisible();
});

test('detalhe público não reutiliza informações da consulta Sabesp', async ({ page }) => {
  const { counts } = await backend(page, 'SABESP');
  await page.goto('/sabesp/chamados/142');
  await expect(page.getByText('marina@exemplo.test')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Observações internas' })).toBeVisible();
  await page.getByRole('link', { name: 'Mapa', exact: true }).click();
  await page.getByRole('button').filter({ hasText: 'SS-2026-0142' }).click();
  await page.getByRole('link', { name: /Ver chamado completo/ }).click();
  await expect(page.getByRole('heading', { name: 'Sobre o problema' })).toBeVisible();
  await expect(page.getByText('marina@exemplo.test')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Observações internas' })).toHaveCount(0);
  expect(counts.get('GET /public/chamados/142')).toBe(1);
});

test('401 atrasado de uma conta anterior não encerra o novo acesso', async ({ page }) => {
  await backend(page);
  let release!: () => void;
  let started!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  const requested = new Promise<void>(resolve => { started = resolve; });
  await page.route('**/api/v1/me/notificacoes*', async route => {
    started();
    await waiting;
    await route.fulfill({ status: 401, json: { message: 'Resposta da sessão anterior' } });
  });
  await page.goto('/meus-chamados');
  await expect(page.getByText('SS-2026-0143')).toBeVisible();
  await page.getByRole('link', { name: 'Avisos', exact: true }).click();
  await requested;
  await page.getByRole('link', { name: 'Perfil', exact: true }).click();
  await page.getByRole('button', { name: /Sair da conta/ }).click();
  await expect(page).toHaveURL(/\/entrar\?retorno=/);
  await page.getByLabel('E-mail', { exact: true }).fill(demoUsers.SABESP.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  await expect(page.getByRole('heading', { name: demoUsers.SABESP.nome })).toBeVisible();
  const response = page.waitForResponse(r => r.url().includes('/me/notificacoes'));
  release();
  await response;
  // Uma nova consulta autenticada também precisa continuar disponível.
  await page.getByRole('link', { name: 'Atendimento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Central de atendimento' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meu perfil', exact: true })).toBeVisible();
});

test('403 mantém o acesso e apresenta a recusa do servidor', async ({ page }) => {
  const { failures } = await backend(page);
  failures.set('GET /me/chamados', { status: 403, message: 'Consulta não autorizada' });
  await page.goto('/meus-chamados');
  await expect(page.getByText('Consulta não autorizada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meu perfil', exact: true })).toBeVisible();
  await expect(page).toHaveURL('/meus-chamados');
});

test('Prefeitura compartilha a consulta da lista com o catálogo de bairros', async ({ page }) => {
  const { counts } = await backend(page, 'PREFEITURA');
  await page.goto('/prefeitura');
  await expect(page.getByRole('heading', { name: 'Um panorama do saneamento' })).toBeVisible();
  await expect(page.locator('.dashboard-metrics').getByText('6', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Bairro', { exact: true }).getByRole('option', { name: 'Gonzaga' })).toHaveCount(1);
  await expect(page.locator('.mobile-case-list').getByText('SS-2026-0142')).toBeVisible();
  expect(counts.get('GET /public/chamados')).toBe(1);
  expect(counts.get('GET /prefeitura/indicadores')).toBe(1);
});
