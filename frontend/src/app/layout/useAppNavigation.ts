import { useAuth } from '@/app/contexts/auth/useAuth';
import { ChartNoAxesCombined, ClipboardList, Wrench } from 'lucide-react';

export function useAppNavigation() {
  const { user } = useAuth();
  const institutional = user?.perfil === 'SABESP' || user?.perfil === 'PREFEITURA';
  const main =
    user?.perfil === 'SABESP'
      ? { to: '/sabesp', label: 'Atendimento', Icon: Wrench }
      : user?.perfil === 'PREFEITURA'
        ? { to: '/prefeitura', label: 'Visão geral', Icon: ChartNoAxesCombined }
        : { to: '/meus-chamados', label: 'Meus chamados', Icon: ClipboardList };
  return { user, institutional, main };
}

export type AppNavigation = ReturnType<typeof useAppNavigation>;
