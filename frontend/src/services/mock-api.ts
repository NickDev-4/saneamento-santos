import { createDemoAddressesService } from './demo/addresses.service';
import { createDemoAuthService } from './demo/auth.service';
import { createDemoCasesService } from './demo/cases.service';
import { createDemoContext } from './demo/context';
import { createDemoIndicatorsService } from './demo/indicators.service';
import { createDemoNoticesService } from './demo/notices.service';
import type { Api } from '@/contracts';

export function createMockApi(): Api {
  const context = createDemoContext();
  return {
    ...createDemoAuthService(context),
    ...createDemoCasesService(context),
    ...createDemoNoticesService(context),
    ...createDemoAddressesService(context),
    ...createDemoIndicatorsService(context),
  };
}

export const mockApi = createMockApi();
