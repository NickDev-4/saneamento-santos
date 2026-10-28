import type { Notice } from '@/contracts';
import { date } from '@/shared/lib/date';
import { ArrowRight, Bell, Check, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
interface Props {
  n: Notice;
  onRead: (id: string) => Promise<boolean>;
}
export function NoticeCard({ n, onRead }: Props) {
  return (
    <article className={`notice ${n.lida ? '' : 'unread'}`}>
      <span className="notice-icon">
        {n.titulo.includes('visita') ? <Wrench size={21} /> : <Bell size={21} />}
      </span>
      <div>
        <div className="notice-top">
          <h2>{n.titulo}</h2>
          <time>{date(n.criadoEm, true)}</time>
        </div>
        <p>{n.texto}</p>
        <div className="notice-actions">
          <Link
            to={`/chamados/${n.chamadoId}?meu=1`}
            onClick={() => {
              void onRead(n.id);
            }}
          >
            Acompanhar chamado
            <ArrowRight size={14} />
          </Link>
          {!n.lida && (
            <button onClick={() => onRead(n.id)}>
              <Check size={14} />
              Marcar como lida
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
