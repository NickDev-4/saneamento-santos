import { DemoProfileSwitch } from '@/features/profile/components/DemoProfileSwitch';
import { EditProfileDialog } from '@/features/profile/components/EditProfileDialog';
import { ProfileMenu } from '@/features/profile/components/ProfileMenu';
import { ProfileSummary } from '@/features/profile/components/ProfileSummary';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';
import { isDemo } from '@/config/environment';
import { PageTitle } from '@/shared/ui/PageTitle';

export function ProfilePage() {
  const { user, signOut, editing, setEditing, busy, mine, save, changeRole } = useProfilePage();
  if (!user) return null;
  return (
    <div className="page-container profile-page">
      <PageTitle title="Meu perfil" description="Sua participação ajuda a cuidar de Santos." />
      <div className="profile-layout">
        <ProfileSummary user={user} mine={mine} />
        <div>
          <ProfileMenu setEditing={setEditing} user={user} signOut={signOut} />
          {isDemo && <DemoProfileSwitch changeRole={changeRole} user={user} />}
        </div>
      </div>
      {editing && <EditProfileDialog user={user} setEditing={setEditing} busy={busy} save={save} />}
    </div>
  );
}
