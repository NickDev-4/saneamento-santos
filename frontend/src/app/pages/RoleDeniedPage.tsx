import { homeFor } from '@/app/routes/navigation';
import type { Role } from '@/contracts';
import { roleLabels } from '@/contracts';
import { State } from '@/shared/ui/State';
import { Link } from 'react-router-dom';

export function RoleDeniedPage({ role }: { role: Role }) {
  return (
    <div className="page-container">
      <State
        title="Esta área pertence a outro perfil"
        text={`Você está usando o perfil ${roleLabels[role]}. Acesse sua área pelo menu.`}
      >
        <Link className="button button-primary" to={homeFor(role)}>
          Ir para minha área
        </Link>
      </State>
    </div>
  );
}
