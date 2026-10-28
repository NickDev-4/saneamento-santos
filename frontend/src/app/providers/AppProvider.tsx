import { ApiProvider } from '@/app/contexts/api/ApiProvider';
import { AuthProvider } from '@/app/contexts/auth/AuthProvider';
import { FeedbackProvider } from '@/app/contexts/feedback/FeedbackProvider';
import { QueryProvider } from '@/app/data/QueryProvider';
import type { Api } from '@/contracts';
import { AddressesProvider } from '@/features/addresses/context/AddressesProvider';
import { CasesProvider } from '@/features/cases/context/CasesProvider';
import { NoticesProvider } from '@/features/notices/context/NoticesProvider';
import { api } from '@/services';
import type { ReactNode } from 'react';

export function AppProvider({ children, service = api }: { children: ReactNode; service?: Api }) {
  return (
    <ApiProvider service={service}>
      <FeedbackProvider>
        <AuthProvider>
          <QueryProvider>
            <CasesProvider>
              <NoticesProvider>
                <AddressesProvider>{children}</AddressesProvider>
              </NoticesProvider>
            </CasesProvider>
          </QueryProvider>
        </AuthProvider>
      </FeedbackProvider>
    </ApiProvider>
  );
}
