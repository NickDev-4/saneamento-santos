import { ProtectedRoute } from './ProtectedRoute';
import { CityHallPage } from '@/features/cityhall/pages/CityHallPage';
import type { RouteObject } from 'react-router-dom';

export const cityhallRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute role="PREFEITURA" />,
    children: [{ path: '/prefeitura', element: <CityHallPage /> }],
  },
];
