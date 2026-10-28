import { PasswordField } from '@/features/auth/components/PasswordField';
import type { AuthFormController } from '@/features/auth/hooks/useAuthForm';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = Pick<
  AuthFormController,
  'showPassword' | 'setShowPassword' | 'error' | 'busy' | 'submit'
> & { mode: 'login' | 'signup' | 'recover' };

export function AuthForm({ mode, showPassword, setShowPassword, error, busy, submit }: Props) {
  return (
    <form className="form-stack" onSubmit={submit}>
      {mode === 'signup' && (
        <Field label="Nome completo" htmlFor="nome">
          <input id="nome" name="nome" autoComplete="name" required minLength={2} />
        </Field>
      )}
      <Field label="E-mail" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
        />
      </Field>
      {mode !== 'recover' && (
        <PasswordField showPassword={showPassword} mode={mode} setShowPassword={setShowPassword} />
      )}
      {mode === 'signup' && (
        <Field label="Telefone" htmlFor="telefone" optional>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            autoComplete="tel"
            placeholder="(13) 99999-9999"
          />
        </Field>
      )}
      {mode === 'login' && (
        <Link className="forgot-link" to="/recuperar-senha">
          Esqueci minha senha
        </Link>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <Button className="button-full" type="submit" disabled={busy}>
        {busy
          ? 'Aguarde…'
          : mode === 'signup'
            ? 'Criar minha conta'
            : mode === 'recover'
              ? 'Solicitar recuperação'
              : 'Entrar na conta'}
        <ArrowRight size={18} />
      </Button>
    </form>
  );
}
