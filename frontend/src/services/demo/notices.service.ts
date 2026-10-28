import type { Api, Notice } from '@/contracts';
import type { DemoContext } from '@/services/demo/context';

export function createDemoNoticesService(context: DemoContext): Pick<Api, 'notices' | 'markRead'> {
  const { pause, requireUser, copy } = context;
  return {
    async notices(): Promise<Notice[]> {
      await pause();
      const id = requireUser().id;
      return copy(context.notices.filter((n) => n.recipient === id)).map(
        ({ recipient: _, ...n }) => n,
      );
    },
    async markRead(id) {
      const n = context.notices.find((n) => n.id === id && n.recipient === requireUser().id);
      if (n) n.lida = true;
    },
  };
}
