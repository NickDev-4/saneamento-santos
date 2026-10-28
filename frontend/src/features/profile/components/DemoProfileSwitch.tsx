import type { Role, User } from '@/contracts';
import { roleLabels } from '@/contracts';
import type { ProfileController } from '@/features/profile/hooks/useProfilePage';
import { Building2, ChevronRight } from 'lucide-react';

type Props = Pick<ProfileController, 'changeRole'> & { user: User };

export function DemoProfileSwitch({ changeRole, user }: Props) {
  return (
    <section className="content-card demo-profile">
      <span className="eyebrow">AMBIENTE DE DEMONSTRAÇÃO</span>
      <h2>Conheça outra área</h2>
      <p>Os dados desta sessão são fictícios e temporários.</p>
      <div className="demo-role-buttons">
        {(['CIDADAO', 'SABESP', 'PREFEITURA'] as Role[])
          .filter((r) => r !== user.perfil)
          .map((r) => (
            <button key={r} onClick={() => changeRole(r)}>
              <Building2 size={18} />
              <span>{roleLabels[r]}</span>
              <ChevronRight size={16} />
            </button>
          ))}
      </div>
    </section>
  );
}
