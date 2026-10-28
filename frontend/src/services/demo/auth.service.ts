import type { Api } from '@/contracts';
import { demoUsers } from '@/mocks/fixtures';
import type { DemoContext } from '@/services/demo/context';

export function createDemoAuthService(
  context: DemoContext,
): Pick<Api, 'me' | 'login' | 'signup' | 'logout' | 'recover' | 'updateProfile'> {
  const { pause, copy, uid, requireUser } = context;
  return {
    async me() {
      await pause();
      return copy(context.session);
    },
    async login(input) {
      await pause();
      context.session = copy(demoUsers[input.perfilDemo ?? 'CIDADAO']);
      return copy(context.session);
    },
    async signup(input) {
      await pause();
      context.session = {
        id: uid(),
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        perfil: 'CIDADAO',
      };
      return copy(context.session);
    },
    async logout() {
      context.session = null;
    },
    async recover() {
      await pause();
    },
    async updateProfile(input) {
      await pause();
      context.session = {
        ...requireUser(),
        nome: input.nome ?? requireUser().nome,
        telefone: input.telefone ?? requireUser().telefone,
      };
      return copy(context.session);
    },
  };
}
