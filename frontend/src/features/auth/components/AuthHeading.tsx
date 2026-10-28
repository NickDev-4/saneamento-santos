import { UserRound } from 'lucide-react';

type Props = {} & { mode: 'login' | 'signup' | 'recover' };

export function AuthHeading({ mode }: Props) {
  return (
    <div className="auth-heading">
      <span className="section-icon">
        <UserRound size={23} />
      </span>
      <h1>
        {mode === 'signup'
          ? 'Vamos começar?'
          : mode === 'recover'
            ? 'Recupere seu acesso'
            : 'Que bom ter você aqui'}
      </h1>
      <p>
        {mode === 'signup'
          ? 'Crie sua conta para registrar e acompanhar chamados.'
          : mode === 'recover'
            ? 'Informe o e-mail utilizado na sua conta.'
            : 'Entre para acompanhar e cuidar da sua cidade.'}
      </p>
    </div>
  );
}
