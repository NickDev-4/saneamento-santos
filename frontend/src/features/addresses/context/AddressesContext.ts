import type { Api } from '@/contracts';
import { createContext } from 'react';

export const AddressesContext = createContext<Pick<Api, 'address' | 'geocode'> | null>(null);
