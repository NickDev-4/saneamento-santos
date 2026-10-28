import type { Role } from '@/contracts';
import { roleLabels } from '@/contracts';
import type { AuthFormController } from '@/features/auth/hooks/useAuthForm';
import { Building2, ChevronRight, UserRound, Wrench } from 'lucide-react';

type Props = Pick<AuthFormController, 'busy' | 'demo'>;

export function DemoAccess({ busy, demo }: Props) {
  return (
    <div className="demo-access">
      <span className="eyebrow">EXPLORE A DEMONSTRAÇÃO</span>
      <p>Escolha uma área para conhecer os fluxos com dados fictícios.</p>
      <div className="demo-role-buttons">
        {(['CIDADAO', 'SABESP', 'PREFEITURA'] as Role[]).map((role) => (
          <button key={role} disabled={busy} onClick={() => demo(role)}>
            {role === 'CIDADAO' ? (
              <UserRound size={18} />
            ) : role === 'SABESP' ? (
              <Wrench size={18} />
            ) : (
              <Building2 size={18} />
            )}
            <span>{roleLabels[role]}</span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
    </div>
  );
}
