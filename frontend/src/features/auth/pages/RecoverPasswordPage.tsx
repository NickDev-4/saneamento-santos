import { AuthPage } from '../components/AuthScreen';

export function RecoverPasswordPage() {
  return <AuthPage mode="recover" />;
}

export function ResetPasswordPage() {
  return <AuthPage mode="reset" />;
}
