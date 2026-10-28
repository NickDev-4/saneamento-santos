import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReportDraft } from '../src/features/report/lib/validateReportDraft.ts';

const now = Date.parse('2026-10-28T12:00:00Z');
const valid = {
  step: 0,
  endereco: {
    cep: '11035200',
    logradouro: 'Rua de exemplo',
    numero: '210',
    semNumero: false,
    bairro: 'Aparecida',
    cidade: 'Santos',
    uf: 'SP',
    referencia: '',
  },
  location: { latitude: -23.96, longitude: -46.33 },
  tipoId: 'extravasamento',
  descricao: 'Esgoto saindo pela tampa de inspeção na calçada.',
  observadoEm: '2026-10-28T11:00:00Z',
  imageCount: 1,
};

test('local exige endereço e coordenadas válidos; aceita endereço sem número', () => {
  assert.deepEqual(validateReportDraft(valid, now), {});
  const draft = { ...valid, endereco: { ...valid.endereco, numero: '', semNumero: true } };
  assert.deepEqual(validateReportDraft(draft, now), {});
  const errors = validateReportDraft(
    {
      ...draft,
      endereco: { ...draft.endereco, cep: '', bairro: '' },
      location: { latitude: NaN, longitude: 181 },
    },
    now,
  );
  assert.deepEqual(Object.keys(errors).sort(), ['bairro', 'cep', 'localizacao']);
});

test('descrição, foto e data observada são validadas antes de revisar', () => {
  const draft = { ...valid, step: 1 };
  assert.deepEqual(validateReportDraft(draft, now), {});
  const errors = validateReportDraft(
    {
      ...draft,
      tipoId: '',
      descricao: 'curta',
      imageCount: 0,
      observadoEm: '2026-10-28T13:00:00Z',
    },
    now,
  );
  assert.deepEqual(Object.keys(errors).sort(), ['descricao', 'imagens', 'observadoEm', 'tipoId']);
});

test('data inválida gera erro no campo sem lançar exceção', () => {
  const errors = validateReportDraft({ ...valid, step: 1, observadoEm: 'data inválida' }, now);
  assert.ok(errors.observadoEm);
});
