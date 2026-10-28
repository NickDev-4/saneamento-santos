import { createAddressesService } from './http/addresses.service';
import { createAuthService } from './http/auth.service';
import { createCasesService } from './http/cases.service';
import type { HttpClientOptions } from './http/client';
import { createHttpClient } from './http/client';
import { createIndicatorsService } from './http/indicators.service';
import { createNoticesService } from './http/notices.service';
import type { Api } from '@/contracts';

export function createHttpApi(options: HttpClientOptions = {}): Api {
  const client = createHttpClient(options);
  return {
    ...createAuthService(client),
    ...createCasesService(client),
    ...createNoticesService(client),
    ...createAddressesService(client),
    ...createIndicatorsService(client),
  };
}

export const httpApi = createHttpApi();
