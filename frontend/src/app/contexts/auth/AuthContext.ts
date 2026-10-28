import type { Api, User } from '@/contracts';
import { createContext } from 'react';

export interface AuthState {
  user: User | null;
  ready: boolean;
  sessionError: string;
  sessionVersion: number;
}

export interface Auth extends AuthState {
  login(input: Parameters<Api['login']>[0]): Promise<User>;
  signup(input: Parameters<Api['signup']>[0]): Promise<User>;
  logout(): Promise<void>;
  recover(email: string): Promise<void>;
  updateProfile(input: Pick<User, 'nome' | 'telefone'>): Promise<User>;
  retrySession(): Promise<void>;
  execute<T>(work: () => Promise<T>): Promise<T>;
}

export const AuthContext = createContext<Auth | null>(null);
