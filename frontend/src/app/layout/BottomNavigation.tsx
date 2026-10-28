import { useAppNavigation } from '@/app/layout/useAppNavigation';
import { Bell, Map, Plus, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function BottomNavigation() {
  const { user, main, institutional } = useAppNavigation();
  return (
    <nav
      className={`bottom-nav ${institutional ? 'institutional-nav' : ''}`}
      aria-label="Navegação do aplicativo"
    >
      <NavLink to="/" end>
        <Map size={22} />
        <span>Mapa</span>
      </NavLink>
      <NavLink to={main.to}>
        <main.Icon size={22} />
        <span>{institutional ? main.label : 'Chamados'}</span>
      </NavLink>
      {!institutional && (
        <NavLink className="register-nav" to="/registrar">
          <span className="register-orb">
            <Plus size={27} />
          </span>
          <span>Registrar</span>
        </NavLink>
      )}
      {!institutional && (
        <NavLink to="/avisos">
          <Bell size={22} />
          <span>Avisos</span>
        </NavLink>
      )}
      <NavLink to={user ? '/perfil' : '/entrar'}>
        <UserRound size={22} />
        <span>{user ? 'Perfil' : 'Entrar'}</span>
      </NavLink>
    </nav>
  );
}
