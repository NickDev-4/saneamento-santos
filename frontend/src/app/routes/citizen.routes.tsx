import { ProtectedRoute } from './ProtectedRoute';
import { MyCasesPage } from '@/features/cases/pages/MyCasesPage';
import { NoticesPage } from '@/features/notices/pages/NoticesPage';
import { ReportPage } from '@/features/report/pages/ReportPage';
import type { RouteObject } from 'react-router-dom';

export const citizenRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute role="CIDADAO" />,
    children: [
      { path: '/meus-chamados', element: <MyCasesPage /> },
      { path: '/registrar', element: <ReportPage /> },
      { path: '/chamados/:id/editar', element: <ReportPage /> },
      { path: '/avisos', element: <NoticesPage /> },
    ],
  },
];
