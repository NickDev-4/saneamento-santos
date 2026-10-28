import { CasesContext } from './CasesContext';
import { useContext } from 'react';

export function useCaseActions() {
  const actions = useContext(CasesContext);
  if (!actions) throw new Error('CasesProvider ausente');
  return actions;
}
