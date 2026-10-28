import type { ReactNode } from 'react';
import type { Api } from '../contracts';
import { api } from '../services';
import { ApiProvider } from './contexts/api-context';
import { AuthProvider } from './contexts/auth-context';
import { DataProvider } from './contexts/data-context';
import { FeedbackProvider } from './contexts/feedback-context';

export { useAuth } from './contexts/auth-context';
export { useFeedback } from './contexts/feedback-context';
export { useCases, useCase, useCaseTypes, useCaseActions, useNotices, useIndicators, useProfileActions, useAddressActions } from './contexts/data-context';

export function AppProvider({ children, service = api }: { children: ReactNode; service?: Api }) {
  return <ApiProvider service={service}>
    <FeedbackProvider><AuthProvider><DataProvider>{children}</DataProvider></AuthProvider></FeedbackProvider>
  </ApiProvider>;
}
