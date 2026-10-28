import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== '/') window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
