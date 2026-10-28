import { AppHeader } from './AppHeader';
import { BottomNavigation } from './BottomNavigation';
import { ScrollToTop } from './ScrollToTop';
import { SkipLink } from '@/shared/ui/SkipLink';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <>
      <SkipLink />
      <AppHeader />
      <main id="conteudo">
        <Outlet />
      </main>
      <BottomNavigation />
      <ScrollToTop />
    </>
  );
}
