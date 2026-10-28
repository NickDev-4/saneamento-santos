import { expect, test } from '@playwright/test';
import { backend } from '../helpers/backend';
import { createFixtures } from '../../src/mocks/fixtures';
import { typeOptions } from '../../src/contracts';

test('registro usa os contexts e envia JSON e imagem pelo adapter HTTP', async ({ page }) => {
  await backend(page);
  const item = createFixtures().find((entry) => entry.id === '143')!;
  let contentType = '';
  let body = '';
  await page.route('**/api/v1/public/tipos-chamado', (route) =>
    route.fulfill({ json: typeOptions }),
  );
  await page.route('**/api/v1/enderecos/cep/*', (route) => route.fulfill({ json: item.endereco }));
  await page.route('**/api/v1/enderecos/geocodificacao', (route) =>
    route.fulfill({ json: item.localizacao }),
  );
  await page.route('**/api/v1/chamados', async (route) => {
    contentType = route.request().headers()['content-type'];
    body = route.request().postDataBuffer()?.toString('utf8') || '';
    await route.fulfill({ json: item });
  });
  await page.goto('/registrar');
  await page.getByLabel('CEP', { exact: true }).fill('11035-200');
  await page.getByRole('button', { name: 'Buscar CEP', exact: true }).click();
  await expect(page.getByLabel('Rua ou avenida', { exact: true })).not.toHaveValue('');
  await page.getByLabel('Número', { exact: true }).fill('210');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByLabel('Tipo de problema', { exact: true }).selectOption('extravasamento');
  await page
    .getByLabel('Descrição do problema', { exact: true })
    .fill('Esgoto saindo pela tampa de inspeção em frente ao local informado.');
  await page
    .locator('#fotos')
    .setInputFiles({
      name: 'relato.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Está tudo certo?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar relato', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Recebemos seu relato!', exact: true }),
  ).toBeVisible();
  expect(contentType).toContain('multipart/form-data');
  expect(body).toContain('name="dados"');
  expect(body).toContain('name="imagensMantidas"');
  expect(body).toContain('name="imagens"; filename="relato.png"');
  expect(body).toContain('"tipoId":"extravasamento"');
  expect(body).toContain('"numero":"210"');
});
