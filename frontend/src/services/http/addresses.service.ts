import type { Api } from '@/contracts';
import type { HttpClient } from '@/services/http/client';

const json = (body: unknown) => JSON.stringify(body);

export function createAddressesService({ request }: HttpClient): Pick<Api, 'address' | 'geocode'> {
  const service: Pick<Api, 'address' | 'geocode'> = {
    address: (cep) => request(`/enderecos/cep/${encodeURIComponent(cep)}`),
    geocode: (endereco) =>
      request('/enderecos/geocodificacao', { method: 'POST', body: json({ endereco }) }),
  };
  return service;
}
