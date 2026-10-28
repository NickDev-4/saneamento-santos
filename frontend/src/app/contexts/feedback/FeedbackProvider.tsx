import { FeedbackContext } from '@/app/contexts/feedback/FeedbackContext';
import { toApiError } from '@/shared/errors/ApiError';
import { Toast } from '@/shared/ui/Toast';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const notify = useCallback((message: string, error = false) => {
    clearTimeout(timer.current);
    setToast({ message, error });
    timer.current = setTimeout(() => setToast(null), 6500);
  }, []);
  const runAction = useCallback(
    async (work: () => Promise<unknown>, message: string) => {
      try {
        await work();
        notify(message);
        return true;
      } catch (error) {
        notify(toApiError(error).message, true);
        return false;
      }
    },
    [notify],
  );
  const value = useMemo(() => ({ notify, runAction }), [notify, runAction]);
  return (
    <FeedbackContext value={value}>
      {children}
      {toast && <Toast value={toast} onClose={() => setToast(null)} />}
    </FeedbackContext>
  );
}
