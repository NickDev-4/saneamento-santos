export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  semNumero: boolean;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}
