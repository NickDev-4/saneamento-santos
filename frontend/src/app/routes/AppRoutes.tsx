import { citizenRoutes } from './citizen.routes';
import { cityhallRoutes } from './cityhall.routes';
import { publicRoutes } from './public.routes';
import { sharedRoutes } from './shared.routes';
import { staffRoutes } from './staff.routes';
import { AppLayout } from '@/app/layout/AppLayout';
import { useRoutes } from 'react-router-dom';

export function AppRoutes() {
  return useRoutes([
    {
      element: <AppLayout />,
      children: [
        ...publicRoutes,
        ...citizenRoutes,
        ...staffRoutes,
        ...cityhallRoutes,
        ...sharedRoutes,
      ],
    },
  ]);
}
