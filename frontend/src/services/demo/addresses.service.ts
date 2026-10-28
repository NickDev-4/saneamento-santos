import type { Api } from '@/contracts';
import type { DemoContext } from '@/services/demo/context';

export function createDemoAddressesService(context: DemoContext): Pick<Api, 'address' | 'geocode'> {
  const { pause } = context;
  return {
    async address(cep) {
      await pause();
      if (cep === '00000000')
        throw new Error('CEP não encontrado. Você pode preencher o endereço manualmente.');
      return {
        cep,
        logradouro: 'Avenida Ana Costa',
        bairro: 'Gonzaga',
        cidade: 'Santos',
        uf: 'SP',
      };
    },
    async geocode() {
      await pause();
      return { latitude: -23.9652, longitude: -46.3343 };
    },
  };
}
