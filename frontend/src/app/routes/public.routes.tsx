import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RecoverPasswordPage } from '@/features/auth/pages/RecoverPasswordPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';
import { CaseDetailPage } from '@/features/cases/pages/CaseDetailPage';
import { MapPage } from '@/features/map/pages/MapPage';
import type { RouteObject } from 'react-router-dom';

export const publicRoutes: RouteObject[] = [
  { path: '/', element: <MapPage /> },
  { path: '/entrar', element: <LoginPage /> },
  { path: '/cadastro', element: <SignupPage /> },
  { path: '/recuperar-senha', element: <RecoverPasswordPage /> },
  { path: '/chamados/:id', element: <CaseDetailPage /> },
];
