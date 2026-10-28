import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = fs.readdirSync(root, { recursive: true }).filter((file) => /\.tsx?$/.test(file));
const graph = new Map();
const errors = [];

function resolve(from, target) {
  if (!target.startsWith('.') && !target.startsWith('@/')) return null;
  const base = target.startsWith('@/')
    ? target.slice(2)
    : path.posix.normalize(path.posix.join(path.posix.dirname(from), target));
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
    (candidate) =>
      fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile(),
  );
}

for (const native of files) {
  const file = native.replaceAll('\\', '/');
  const source = fs.readFileSync(path.join(root, native), 'utf8');
  const edges = [];
  // Imports are formatted consistently; type-only edges do not create runtime cycles.
  const imports = source.matchAll(
    /^(?:import|export)\s+(type\s+)?[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gm,
  );
  for (const match of imports) {
    const target = resolve(file, match[2]);
    if (!target || !/\.tsx?$/.test(target)) continue;
    if (/^(services|contracts)\//.test(file) && /^(app|features)\//.test(target))
      errors.push(`${file}: camada de dados não pode depender de ${target}`);
    if (file.startsWith('contracts/') && !target.startsWith('contracts/'))
      errors.push(`${file}: contrato deve ser independente de ${target}`);
    if (file.startsWith('shared/') && /^(app|features|services)\//.test(target))
      errors.push(`${file}: componente/utilitário compartilhado não pode depender de ${target}`);
    if (file.startsWith('features/') && target.startsWith('services/'))
      errors.push(`${file}: use um hook/context de domínio, em vez de importar ${target}`);
    if (file.startsWith('features/') && target.startsWith('app/providers/'))
      errors.push(`${file}: funcionalidade não pode importar a composição global`);
    if (/\/(components|hooks|context|operations)\//.test(file) && /\/pages\//.test(target))
      errors.push(`${file}: componente/hook não pode depender de uma página (${target})`);
    if (!match[1]) edges.push(target);
  }
  graph.set(file, edges);
}

const complete = new Set();
const visiting = new Set();
function visit(file, stack = []) {
  if (visiting.has(file)) {
    errors.push(`Dependência circular: ${[...stack, file].join(' -> ')}`);
    return;
  }
  if (complete.has(file)) return;
  visiting.add(file);
  for (const next of graph.get(file) || []) visit(next, [...stack, file]);
  visiting.delete(file);
  complete.add(file);
}
for (const file of graph.keys()) visit(file);
assert.equal(errors.length, 0, errors.join('\n'));
console.log(`Arquitetura validada: ${files.length} arquivos, camadas sem ciclos de execução.`);
