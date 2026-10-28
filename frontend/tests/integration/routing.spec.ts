import { expect, test } from '@playwright/test';
import { backend } from '../helpers/backend';
import { demoUsers } from '../../src/mocks/fixtures';

test('visitante é encaminhado ao login em todas as áreas protegidas', async ({ page }) => {
  const { counts } = await backend(page, null);
  for (const path of [
    '/meus-chamados',
    '/registrar',
    '/avisos',
    '/perfil',
    '/sabesp',
    '/sabesp/chamados/142',
    '/prefeitura',
    '/chamados/143/editar',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Entrar na conta', exact: true })).toBeVisible();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/entrar');
    expect(url.searchParams.get('retorno')).toBe(path);
  }
  expect(counts.get('GET /me/chamados')).toBeUndefined();
  expect(counts.get('GET /operacao/chamados')).toBeUndefined();
  expect(counts.get('GET /prefeitura/indicadores')).toBeUndefined();
});

test('cidadão não consulta os endpoints institucionais ao abrir suas rotas', async ({ page }) => {
  const { counts } = await backend(page);
  for (const path of ['/sabesp', '/sabesp/chamados/142', '/prefeitura']) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Esta área pertence a outro perfil' }),
    ).toBeVisible();
  }
  expect(counts.get('GET /operacao/chamados')).toBeUndefined();
  expect(counts.get('GET /prefeitura/indicadores')).toBeUndefined();
});

test('equipe Sabesp não abre o registro exclusivo de cidadão', async ({ page }) => {
  const { counts } = await backend(page, 'SABESP');
  await page.goto('/registrar');
  await expect(
    page.getByRole('heading', { name: 'Esta área pertence a outro perfil' }),
  ).toBeVisible();
  expect(counts.get('GET /public/tipos-chamado')).toBeUndefined();
});

test('login retorna ao endereço protegido com seus parâmetros', async ({ page }) => {
  await backend(page, null);
  await page.goto('/meus-chamados?origem=teste');
  await expect(page.getByRole('button', { name: 'Entrar na conta', exact: true })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill(demoUsers.CIDADAO.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  await page.waitForURL('**/meus-chamados?origem=teste');
  await expect(page.getByRole('heading', { name: 'Meus chamados', exact: true })).toBeVisible();
});

test('instâncias do adapter de demonstração isolam sessão e alterações', async ({ page }) => {
  await backend(page, null);
  await page.goto('/entrar');
  const result = await page.evaluate(async (url) => {
    const { createMockApi } = await import(/* @vite-ignore */ url);
    const first = createMockApi();
    const second = createMockApi();
    await first.login({ perfilDemo: 'CIDADAO' });
    const anonymousSecond = await second.me();
    await second.login({ perfilDemo: 'CIDADAO' });
    await first.cancel('143');
    const firstCase = await first.detail('143', 'mine');
    const secondCase = await second.detail('143', 'mine');
    await first.logout();
    return {
      anonymousSecond,
      first: firstCase.status,
      second: secondCase.status,
      secondLoggedIn: Boolean(await second.me()),
    };
  }, '/src/services/mock-api.ts');
  expect(result).toEqual({
    anonymousSecond: null,
    first: 'CANCELADO',
    second: 'RECEBIDO',
    secondLoggedIn: true,
  });
});
