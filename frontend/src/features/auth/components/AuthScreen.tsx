import { AuthForm } from '@/features/auth/components/AuthForm';
import { AuthHeading } from '@/features/auth/components/AuthHeading';
import { AuthStory } from '@/features/auth/components/AuthStory';
import { DemoAccess } from '@/features/auth/components/DemoAccess';
import { useAuthForm } from '@/features/auth/hooks/useAuthForm';
import { isDemo } from '@/config/environment';
import { BackLink } from '@/shared/ui/BackLink';
import { Success } from '@/shared/ui/Success';
import { Link } from 'react-router-dom';

export function AuthPage({ mode }: { mode: 'login' | 'signup' | 'recover' }) {
  const { busy, error, showPassword, setShowPassword, sent, submit, demo } = useAuthForm(mode);
  if (sent)
    return (
      <div className="auth-layout">
        <Success
          title={isDemo ? 'Confirmação de demonstração' : 'Confira seu e-mail'}
          text={
            isDemo
              ? 'Este é o estado de confirmação da recuperação de acesso. Nenhuma mensagem foi enviada nesta demonstração.'
              : 'Se o e-mail estiver cadastrado, você receberá as instruções para recuperar o acesso.'
          }
          to="/entrar"
          label="Voltar para o acesso"
        />
      </div>
    );
  return (
    <div className="auth-layout">
      <AuthStory />
      <div className="auth-form-panel">
        <BackLink to="/">Voltar ao mapa</BackLink>
        <AuthHeading mode={mode} />
        <AuthForm
          mode={mode}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          error={error}
          busy={busy}
          submit={submit}
        />
        {mode === 'login' ? (
          <p className="auth-switch">
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        ) : (
          <p className="auth-switch">
            Já tem uma conta? <Link to="/entrar">Entrar</Link>
          </p>
        )}
        {isDemo && mode === 'login' && <DemoAccess busy={busy} demo={demo} />}
        {!isDemo && mode === 'login' && (
          <p className="field-hint">
            Equipe Sabesp e Prefeitura: utilize sua conta institucional previamente cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
