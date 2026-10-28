import type { AppNavigation } from '@/app/layout/useAppNavigation';
import { Building2, Map } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type Props = Pick<AppNavigation, 'main' | 'user'>;

export function DesktopNavigation({ main, user }: Props) {
  return (
    <nav className="desktop-nav" aria-label="Navegação principal">
      <NavLink to="/" end>
        <Map size={17} />
        Mapa da cidade
      </NavLink>
      <NavLink to={main.to}>
        <main.Icon size={17} />
        {main.label}
      </NavLink>
      {!user && (
        <NavLink to="/entrar?institucional=1">
          <Building2 size={17} />
          Acesso institucional
        </NavLink>
      )}
    </nav>
  );
}
