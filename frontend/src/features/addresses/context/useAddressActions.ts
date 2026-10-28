import { AddressesContext } from './AddressesContext';
import { useContext } from 'react';

export function useAddressActions() {
  const context = useContext(AddressesContext);
  if (!context) throw new Error('AddressesProvider ausente');
  return context;
}
