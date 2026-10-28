import type { User } from '@/contracts';
import { roleLabels } from '@/contracts';
import type { ProfileController } from '@/features/profile/hooks/useProfilePage';
import { Check, ClipboardList, ShieldCheck, Waves } from 'lucide-react';

type Props = Pick<ProfileController, 'mine'> & { user: User };

export function ProfileSummary({ user, mine }: Props) {
  return (
    <section className="profile-summary">
      <div className="profile-cover">
        <Waves size={220} strokeWidth={0.6} />
      </div>
      <div className="profile-avatar">
        {user.nome
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')}
      </div>
      <h2>{user.nome}</h2>
      <span className="profile-role">
        <ShieldCheck size={15} />
        {roleLabels[user.perfil]}
      </span>
      <p>{user.email}</p>
      {user.perfil === 'CIDADAO' && (
        <div className="profile-stats">
          <div>
            <ClipboardList size={21} />
            <strong>{mine.data?.length ?? '—'}</strong>
            <span>Seus registros</span>
          </div>
          <div>
            <Check size={21} />
            <strong>{mine.data?.filter((c) => c.status === 'RESOLVIDO').length ?? '—'}</strong>
            <span>Resolvidos</span>
          </div>
        </div>
      )}
    </section>
  );
}
