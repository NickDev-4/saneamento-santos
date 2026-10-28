import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  globalSetup: './tests/server-setup.ts',
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'retain-on-failure' },
  projects: [{ name: 'edge-mobile', use: { ...devices['Pixel 7'], channel: 'msedge' } }],
});
