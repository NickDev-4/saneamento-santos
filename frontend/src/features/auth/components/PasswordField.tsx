import type { AuthFormController } from '@/features/auth/hooks/useAuthForm';
import { Field } from '@/shared/ui/Field';
import { Eye, EyeOff } from 'lucide-react';

type Props = Pick<AuthFormController, 'showPassword' | 'setShowPassword'> & {
  mode: 'login' | 'signup' | 'recover';
};

export function PasswordField({ showPassword, mode, setShowPassword }: Props) {
  return (
    <Field
      label="Senha"
      htmlFor="senha"
      hint={mode === 'signup' ? 'Use pelo menos 8 caracteres.' : undefined}
    >
      <div className="password-input">
        <input
          id="senha"
          name="senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          required
          minLength={mode === 'signup' ? 8 : 1}
        />
        <button
          type="button"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}
