import { AddressesContext } from './AddressesContext';
import { useApi } from '@/app/contexts/api/useApi';
import { useSession } from '@/app/contexts/auth/useSession';
import type { Address } from '@/contracts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export function AddressesProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { execute } = useSession();
  const value = useMemo(
    () => ({
      address: (cep: string) => execute(() => api.address(cep)),
      geocode: (address: Address) => execute(() => api.geocode(address)),
    }),
    [api, execute],
  );
  return <AddressesContext value={value}>{children}</AddressesContext>;
}
