import { useAuth } from '@/app/contexts/auth/useAuth';
import { homeFor } from '@/app/routes/navigation';
import type { Role } from '@/contracts';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { useState } from 'react';

export function useAuthForm(mode: 'login' | 'signup' | 'recover') {
  const { login, signup, recover } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const target = (role: Role) => {
    const raw = params.get('retorno');
    return raw?.startsWith('/') && !raw.startsWith('//') ? raw : homeFor(role);
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError('');
    setBusy(true);
    try {
      const email = String(form.get('email')).trim();
      const senha = String(form.get('senha') || '');
      if (mode === 'recover') {
        await recover(email);
        setSent(true);
      } else {
        const user =
          mode === 'signup'
            ? await signup({
                nome: String(form.get('nome')).trim(),
                email,
                senha,
                telefone: String(form.get('telefone') || ''),
              })
            : await login({ email, senha });
        navigate(target(user.perfil));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo(role: Role) {
    setBusy(true);
    try {
      const user = await login({ perfilDemo: role });
      navigate(role === 'CIDADAO' ? target(user.perfil) : homeFor(role));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, showPassword, setShowPassword, sent, submit, demo };
}

export type AuthFormController = ReturnType<typeof useAuthForm>;
