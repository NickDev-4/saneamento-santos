import type { CaseInput } from '@/contracts';

const json = (body: unknown) => JSON.stringify(body);

export function form(input: CaseInput) {
  const data = new FormData();
  const { imagens, imagensMantidas, ...dados } = input;
  data.append('dados', new Blob([json(dados)], { type: 'application/json' }));
  data.append(
    'imagensMantidas',
    new Blob([json(imagensMantidas.map((i) => i.id))], { type: 'application/json' }),
  );
  imagens.forEach((file) => data.append('imagens', file));
  return data;
}
