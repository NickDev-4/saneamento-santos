import { useFeedback } from '@/app/contexts/feedback/useFeedback';
import { useNotices } from '@/features/notices/hooks/useNotices';

export function useNoticesPage() {
  const { runAction } = useFeedback();
  const { data, loading, error, retry, markRead } = useNotices();
  function readNotice(id: string) {
    return runAction(() => markRead(id), 'Notificação marcada como lida.');
  }
  return { data, loading, error, retry, readNotice };
}

export type NoticesController = ReturnType<typeof useNoticesPage>;
