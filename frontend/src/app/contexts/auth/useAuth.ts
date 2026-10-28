import { useSession } from './useSession';
import { useMemo } from 'react';

export function useAuth() {
  const { user, ready, sessionError, login, signup, logout, recover, retrySession } = useSession();
  return useMemo(
    () => ({ user, ready, sessionError, login, signup, logout, recover, retrySession }),
    [user, ready, sessionError, login, signup, logout, recover, retrySession],
  );
}
