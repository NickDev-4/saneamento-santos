import type { AppNavigation } from '@/app/layout/useAppNavigation';

import { UserRound } from 'lucide-react';

import { Link } from 'react-router-dom';

type Props = Pick<AppNavigation, 'user'>;
export function UserMenuLink({ user }: Props) {
  return (
    <Link
      className={`avatar-button ${user ? '' : 'guest-avatar'}`}
      to={user ? '/perfil' : '/entrar'}
      aria-label={user ? 'Meu perfil' : 'Entrar na conta'}
    >
      {user ? (
        user.nome
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
      ) : (
        <UserRound size={20} />
      )}
    </Link>
  );
}
