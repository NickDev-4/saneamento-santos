import { useAuth } from '@/app/contexts/auth/useAuth';
import { useFeedback } from '@/app/contexts/feedback/useFeedback';
import { homeFor } from '@/app/routes/navigation';
import type { Role } from '@/contracts';
import { useCases } from '@/features/cases/hooks/useCases';
import { useProfileActions } from '@/features/profile/hooks/useProfileActions';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';
import { useState } from 'react';

export function useProfilePage() {
  const { user, logout, login } = useAuth();
  const { notify, runAction } = useFeedback();
  const { updateProfile } = useProfileActions();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = useCases('mine');
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateProfile({
        nome: String(form.get('nome')).trim(),
        telefone: String(form.get('telefone') || ''),
      });
      setEditing(false);
      notify('Perfil atualizado.');
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function changeRole(role: Role) {
    try {
      await login({ perfilDemo: role });
      navigate(homeFor(role));
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function signOut() {
    await runAction(logout, 'Você saiu da conta.');
  }
  return { user, editing, setEditing, busy, mine, save, changeRole, signOut };
}

export type ProfileController = ReturnType<typeof useProfilePage>;
