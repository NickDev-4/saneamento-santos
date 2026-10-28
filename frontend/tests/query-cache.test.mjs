import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryCache } from '../src/app/data/query-cache.ts';
import { ApiError } from '../src/services/api-error.ts';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const flush = () => new Promise(resolve => setImmediate(resolve));

test('duas telas compartilham uma requisição e o resultado em cache', async () => {
  const cache = new QueryCache();
  const response = deferred();
  let calls = 0;
  const load = () => { calls++; return response.promise; };
  const first = cache.fetch('public', load, ['cases']);
  const second = cache.fetch('public', load, ['cases']);
  assert.equal(first, second);
  response.resolve(['142']);
  await first;
  await cache.fetch('public', load, ['cases']);
  assert.equal(calls, 1);
  assert.deepEqual(cache.snapshot('public').data, ['142']);
  assert.equal(cache.snapshot('public').loading, false);
});

test('alterar um chamado atualiza consultas ativas e marca as inativas para a próxima leitura', async () => {
  const cache = new QueryCache();
  let value = 'recebido';
  let activeCalls = 0;
  let inactiveCalls = 0;
  const load = async () => { activeCalls++; return value; };
  const inactive = async () => { inactiveCalls++; return value; };
  const unsubscribe = cache.subscribe('detail', () => {});
  await cache.fetch('detail', load, ['cases']);
  await cache.fetch('list', inactive, ['cases']);
  await cache.fetch('types', async () => ['odor'], ['catalogue']);
  const catalogue = cache.snapshot('types');
  value = 'cancelado';
  cache.invalidate(['cases']);
  await flush();
  assert.equal(activeCalls, 2);
  assert.equal(inactiveCalls, 1);
  assert.equal(cache.snapshot('detail').data, 'cancelado');
  assert.equal(cache.snapshot('types'), catalogue);
  await cache.fetch('list', inactive, ['cases']);
  assert.equal(cache.snapshot('list').data, 'cancelado');
  assert.equal(inactiveCalls, 2);
  unsubscribe();
});

test('uma resposta anterior à alteração não sobrescreve dados novos', async () => {
  const cache = new QueryCache();
  const old = deferred();
  let calls = 0;
  const load = () => ++calls === 1 ? old.promise : Promise.resolve('novo');
  cache.subscribe('detail', () => {});
  const pending = cache.fetch('detail', load, ['cases']);
  await flush();
  cache.invalidate(['cases']);
  await flush();
  assert.equal(cache.snapshot('detail').data, 'novo');
  old.resolve('antigo');
  await pending;
  assert.equal(cache.snapshot('detail').data, 'novo');
});

test('erros preservam status e campos e permitem tentar novamente', async () => {
  const cache = new QueryCache();
  let fail = true;
  const load = async () => {
    if (fail) throw new ApiError('Dados inválidos', 422, { descricao: 'Revise a descrição' });
    return ['142'];
  };
  await cache.fetch('mine', load, ['cases']);
  assert.equal(cache.snapshot('mine').failure.status, 422);
  assert.equal(cache.snapshot('mine').failure.fields.descricao, 'Revise a descrição');
  fail = false;
  cache.retry('mine');
  await flush();
  assert.equal(cache.snapshot('mine').error, '');
  assert.deepEqual(cache.snapshot('mine').data, ['142']);
});

test('instâncias de sessões diferentes isolam dados e respostas pendentes', async () => {
  const old = new QueryCache();
  const current = new QueryCache();
  const response = deferred();
  const pending = old.fetch('mine', () => response.promise, ['cases']);
  await current.fetch('mine', async () => ['outro usuário'], ['cases']);
  response.resolve(['usuário anterior']);
  await pending;
  assert.deepEqual(current.snapshot('mine').data, ['outro usuário']);
});
