import { homeFor } from '@/app/routes/navigation';
import type { User } from '@/contracts';
import type { ProfileController } from '@/features/profile/hooks/useProfilePage';
import { Bell, ChevronRight, ClipboardList, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = Pick<ProfileController, 'setEditing' | 'signOut'> & { user: User };

export function ProfileMenu({ setEditing, user, signOut }: Props) {
  return (
    <section className="content-card profile-menu">
      <h2>Sua conta</h2>
      <button onClick={() => setEditing(true)}>
        <UserRound size={20} />
        <span>
          <strong>Editar perfil</strong>
          <small>Nome e telefone de contato</small>
        </span>
        <ChevronRight size={18} />
      </button>
      <Link to={homeFor(user.perfil)}>
        <ClipboardList size={20} />
        <span>
          <strong>{user.perfil === 'CIDADAO' ? 'Histórico de chamados' : 'Minha área'}</strong>
          <small>Acompanhe as informações do seu perfil</small>
        </span>
        <ChevronRight size={18} />
      </Link>
      {user.perfil === 'CIDADAO' && (
        <Link to="/avisos">
          <Bell size={20} />
          <span>
            <strong>Notificações</strong>
            <small>Atualizações sobre seus chamados</small>
          </span>
          <ChevronRight size={18} />
        </Link>
      )}
      <button onClick={signOut}>
        <LogOut size={20} />
        <span>
          <strong>Sair da conta</strong>
          <small>Encerrar este acesso</small>
        </span>
        <ChevronRight size={18} />
      </button>
    </section>
  );
}
