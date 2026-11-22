export const environment = {
  dataMode: import.meta.env.VITE_DATA_MODE || 'api',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  mapTileUrl: import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  showDemoAccounts: import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true',
} as const;

export const isDemo = environment.dataMode === 'demo';
