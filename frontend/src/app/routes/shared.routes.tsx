import { ProtectedRoute } from './ProtectedRoute';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import type { RouteObject } from 'react-router-dom';

export const sharedRoutes: RouteObject[] = [
  { element: <ProtectedRoute />, children: [{ path: '/perfil', element: <ProfilePage /> }] },
  { path: '*', element: <NotFoundPage /> },
];
