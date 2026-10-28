import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toApiError } from '../../services/api-error';

interface Feedback {
  notify(message: string, error?: boolean): void;
  runAction(work: () => Promise<unknown>, message: string): Promise<boolean>;
}

const FeedbackContext = createContext<Feedback | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const notify = useCallback((message: string, error = false) => {
    clearTimeout(timer.current);
    setToast({ message, error });
    timer.current = setTimeout(() => setToast(null), 6500);
  }, []);
  const runAction = useCallback(async (work: () => Promise<unknown>, message: string) => {
    try { await work(); notify(message); return true; }
    catch (error) { notify(toApiError(error).message, true); return false; }
  }, [notify]);
  const value = useMemo(() => ({ notify, runAction }), [notify, runAction]);
  return <FeedbackContext value={value}>
    {children}
    {toast && <div className={`toast ${toast.error ? 'toast-error' : ''}`} role={toast.error ? 'alert' : 'status'}>
      <span>{toast.message}</span><button aria-label="Fechar aviso" onClick={() => setToast(null)}>×</button>
    </div>}
  </FeedbackContext>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('FeedbackProvider ausente');
  return context;
}
