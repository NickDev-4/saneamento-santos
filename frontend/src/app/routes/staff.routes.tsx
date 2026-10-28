import { ProtectedRoute } from './ProtectedRoute';
import { CaseDetailPage } from '@/features/cases/pages/CaseDetailPage';
import { StaffPage } from '@/features/staff/pages/StaffPage';
import type { RouteObject } from 'react-router-dom';

export const staffRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute role="SABESP" />,
    children: [
      { path: '/sabesp', element: <StaffPage /> },
      { path: '/sabesp/chamados/:id', element: <CaseDetailPage operational /> },
    ],
  },
];
