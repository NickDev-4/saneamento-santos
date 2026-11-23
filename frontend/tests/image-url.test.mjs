import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiImageUrl } from '../src/shared/lib/image-url.ts';

test('resolves API image paths against a separate API origin', () => {
  assert.equal(
    resolveApiImageUrl(
      '/api/v1/imagens/example',
      'https://api.example.test/api/v1',
      'https://app.example.test',
    ),
    'https://api.example.test/api/v1/imagens/example',
  );
});

test('resolves public API image paths against a separate API origin', () => {
  assert.equal(
    resolveApiImageUrl(
      '/api/v1/public/imagens/example',
      'https://api.example.test/api/v1',
      'https://app.example.test',
    ),
    'https://api.example.test/api/v1/public/imagens/example',
  );
});

test('keeps root-relative frontend assets on the application origin', () => {
  assert.equal(
    resolveApiImageUrl(
      '/cenario-esgoto.svg',
      'https://api.example.test/api/v1',
      'https://app.example.test',
    ),
    'https://app.example.test/cenario-esgoto.svg',
  );
});

test('preserves data, blob, and absolute image URLs', () => {
  for (const url of [
    'data:image/png;base64,abc',
    'blob:https://app.example.test/id',
    'https://cdn.example.test/a.png',
  ]) {
    assert.equal(
      resolveApiImageUrl(url, 'https://api.example.test/api/v1', 'https://app.example.test'),
      url,
    );
  }
});
