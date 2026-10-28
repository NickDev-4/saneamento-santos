import { SessionError } from './SessionError';
import { useAuth } from '@/app/contexts/auth/useAuth';
import type { Role } from '@/contracts';
import { RoleDeniedPage } from '@/app/pages/RoleDeniedPage';
import { State } from '@/shared/ui/State';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function ProtectedRoute({ role }: { role?: Role }) {
  const { user, ready, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (!ready) return <State loading />;
  if (sessionError && !user) return <SessionError error={sessionError} onRetry={retrySession} />;
  if (!user)
    return (
      <Navigate
        to={`/entrar?retorno=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (role && user.perfil !== role) return <RoleDeniedPage role={user.perfil} />;
  return <Outlet />;
}
