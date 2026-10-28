import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// A API do Vite permite encerrar a instância diretamente, sem depender de
// taskkill ou de processos intermediários de um shell no Windows.
export default async function setup() {
  const previousMode = process.env.VITE_DATA_MODE;
  process.env.VITE_DATA_MODE = 'api';
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    mode: 'test',
    server: { host: '127.0.0.1', port: 5174, strictPort: true, open: false },
  });
  const restore = () => {
    if (previousMode === undefined) delete process.env.VITE_DATA_MODE;
    else process.env.VITE_DATA_MODE = previousMode;
  };
  try {
    await server.listen();
  } catch (error) {
    await server.close();
    restore();
    throw error;
  }
  return async () => {
    try {
      await server.close();
    } finally {
      restore();
    }
  };
}
