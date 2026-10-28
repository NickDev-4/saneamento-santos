import { useApi } from '@/app/contexts/api/useApi';
import type { AuthState } from '@/app/contexts/auth/AuthContext';
import { AuthContext } from '@/app/contexts/auth/AuthContext';
import type { Api, User } from '@/contracts';
import { toApiError } from '@/shared/errors/ApiError';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [state, setState] = useState<AuthState>({
    user: null,
    ready: false,
    sessionError: '',
    sessionVersion: 0,
  });
  const generation = useRef(0);
  const currentUser = useRef<User | null>(null);
  const mounted = useRef(false);
  const authRequest = useRef(0);

  const replaceSession = useCallback((user: User | null) => {
    currentUser.current = user;
    const sessionVersion = ++generation.current;
    setState({ user, ready: true, sessionError: '', sessionVersion });
  }, []);

  const retrySession = useCallback(async () => {
    const request = ++authRequest.current;
    setState((previous) => ({ ...previous, ready: false, sessionError: '' }));
    try {
      const user = await api.me();
      if (mounted.current && request === authRequest.current) replaceSession(user);
    } catch (error) {
      if (mounted.current && request === authRequest.current) {
        setState((previous) => ({
          ...previous,
          ready: true,
          sessionError: toApiError(error).message,
        }));
      }
    }
  }, [api, replaceSession]);

  useEffect(() => {
    mounted.current = true;
    void retrySession();
    return () => {
      mounted.current = false;
      ++authRequest.current;
    };
  }, [retrySession]);

  const execute = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T> => {
      const startedIn = generation.current;
      const startedRequest = authRequest.current;
      try {
        return await work();
      } catch (error) {
        const failure = toApiError(error);
        if (
          failure.status === 401 &&
          currentUser.current &&
          mounted.current &&
          startedIn === generation.current &&
          startedRequest === authRequest.current
        ) {
          ++authRequest.current;
          replaceSession(null);
        }
        throw failure;
      }
    },
    [replaceSession],
  );

  const login = useCallback(
    async (input: Parameters<Api['login']>[0]) => {
      const request = ++authRequest.current;
      const user = await api.login(input);
      if (mounted.current && request === authRequest.current) replaceSession(user);
      return user;
    },
    [api, replaceSession],
  );

  const signup = useCallback(
    async (input: Parameters<Api['signup']>[0]) => {
      const request = ++authRequest.current;
      const user = await api.signup(input);
      if (mounted.current && request === authRequest.current) replaceSession(user);
      return user;
    },
    [api, replaceSession],
  );

  const logout = useCallback(async () => {
    const request = ++authRequest.current;
    await execute(() => api.logout());
    if (mounted.current && request === authRequest.current) replaceSession(null);
  }, [api, execute, replaceSession]);

  const recover = useCallback((email: string) => api.recover(email), [api]);
  const updateProfile = useCallback(
    async (input: Pick<User, 'nome' | 'telefone'>) => {
      const startedIn = generation.current;
      const user = await execute(() => api.updateProfile(input));
      if (mounted.current && startedIn === generation.current)
        setState((previous) => ({ ...previous, user }));
      return user;
    },
    [api, execute],
  );

  const value = useMemo(
    () => ({ ...state, login, signup, logout, recover, updateProfile, retrySession, execute }),
    [state, login, signup, logout, recover, updateProfile, retrySession, execute],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
