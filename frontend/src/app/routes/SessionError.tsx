import { State } from '@/shared/ui/State';

export function SessionError({ error, onRetry }: { error: string; onRetry: () => Promise<void> }) {
  return (
    <State
      error={error}
      retry={() => {
        void onRetry();
      }}
    />
  );
}
