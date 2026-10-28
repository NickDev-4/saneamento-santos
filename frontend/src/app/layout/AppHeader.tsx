import { useAppNavigation } from '@/app/layout/useAppNavigation';

import { Brand } from '@/shared/branding/Brand';

import { DesktopNavigation } from '@/app/layout/DesktopNavigation';

import { MapPin } from 'lucide-react';

import { isDemo } from '@/config/environment';

import { DemoBadge } from '@/app/layout/DemoBadge';

import { HeaderNotifications } from '@/app/layout/HeaderNotifications';

import { UserMenuLink } from '@/app/layout/UserMenuLink';

export function AppHeader() {
  const { user, main } = useAppNavigation();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand />
        <DesktopNavigation main={main} user={user} />
        <div className="header-actions">
          <span className="city-label">
            <MapPin size={14} />
            Santos, SP
          </span>
          {isDemo && <DemoBadge />}
          {user?.perfil === 'CIDADAO' && <HeaderNotifications />}
          <UserMenuLink user={user} />
        </div>
      </div>
    </header>
  );
}
