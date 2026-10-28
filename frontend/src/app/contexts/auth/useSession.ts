import { AuthContext } from './AuthContext';
import { useContext } from 'react';

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider ausente');
  return context;
}
