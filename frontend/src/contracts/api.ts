import type { Address, Location } from './address';
import type { Role, User } from './auth';
import type { Case, CaseInput, Filters, Scope, Status } from './cases';
import type { Indicators } from './indicators';
import type { Notice } from './notices';

export interface Api {
  types(): Promise<{ id: string; nome: string }[]>;
  me(): Promise<User | null>;
  login(input: { email?: string; senha?: string; perfilDemo?: Role }): Promise<User>;
  signup(input: { nome: string; email: string; senha: string; telefone?: string }): Promise<User>;
  logout(): Promise<void>;
  recover(email: string): Promise<void>;
  updateProfile(input: Partial<User>): Promise<User>;
  list(scope: Scope, filters?: Filters): Promise<Case[]>;
  detail(id: string, scope: Scope): Promise<Case>;
  save(input: CaseInput, id?: string): Promise<Case>;
  cancel(id: string): Promise<void>;
  transition(id: string, status: Status, texto?: string, foto?: File): Promise<void>;
  publish(id: string, approved: boolean, motivo?: string): Promise<void>;
  schedule(id: string, inicio: string, fim: string): Promise<void>;
  link(id: string, principalId: string, motivo: string): Promise<void>;
  comment(id: string, texto: string, internal: boolean): Promise<void>;
  notices(): Promise<Notice[]>;
  markRead(id: string): Promise<void>;
  address(cep: string): Promise<Partial<Address>>;
  geocode(address: Address): Promise<Location>;
  indicators(filters?: Filters): Promise<Indicators>;
}
