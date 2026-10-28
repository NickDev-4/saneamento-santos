import { NoticeCard } from '@/features/notices/components/NoticeCard';
import { useNoticesPage } from '@/features/notices/hooks/useNoticesPage';
import { PageTitle } from '@/shared/ui/PageTitle';
import { State } from '@/shared/ui/State';
import { Mail } from 'lucide-react';

export function NoticesPage() {
  const { data, loading, error, retry, readNotice } = useNoticesPage();
  return (
    <div className="page-container narrow-page">
      <PageTitle
        eyebrow="FIQUE POR DENTRO"
        title="Notificações"
        description="Cada passo do atendimento, em um só lugar."
      />
      <section className="content-card notices-list">
        {loading || error ? (
          <State loading={loading} error={error} retry={retry} />
        ) : !data?.length ? (
          <State
            title="Tudo em dia por aqui"
            text="Quando houver uma atualização nos seus chamados, você verá o aviso aqui."
          />
        ) : (
          data.map((n) => <NoticeCard key={n.id} n={n} onRead={readNotice} />)
        )}
      </section>
      <p className="page-footnote">
        <Mail size={15} />
        Os avisos desta versão ficam disponíveis dentro do sistema.
      </p>
    </div>
  );
}
