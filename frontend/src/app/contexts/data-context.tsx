import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { Api, Case, Filters, Indicators, Notice, Scope, User } from '../../contracts';
import { QueryCache } from '../data/query-cache';
import type { QueryState } from '../data/query-cache';
import { useApi } from './api-context';
import { useAuth, useSession } from './auth-context';

type CaseActions = Pick<Api, 'save' | 'cancel' | 'transition' | 'publish' | 'schedule' | 'link' | 'comment'>;
interface DataContextValue {
  cache: QueryCache;
  cases: CaseActions;
  markRead: Api['markRead'];
  updateProfile(input: Pick<User, 'nome' | 'telefone'>): Promise<User>;
  address: Api['address'];
  geocode: Api['geocode'];
}

const DataContext = createContext<DataContextValue | null>(null);
const caseTags = ['cases', 'indicators', 'notices'];
const idle: QueryState<never> = { data: null, loading: false, error: '', failure: null };

export function DataProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { sessionVersion, execute, updateProfile: saveProfile } = useSession();
  // A troca acontece no render da nova sessão, antes de qualquer consulta privada.
  const cache = useMemo(() => new QueryCache(), [api, sessionVersion]);
  const value = useMemo<DataContextValue>(() => {
    async function change<T>(work: () => Promise<T>, tags: readonly string[]) {
      const result = await execute(work);
      cache.invalidate(tags);
      return result;
    }
    return {
      cache,
      cases: {
        save: (input, id) => change(() => api.save(input, id), caseTags),
        cancel: id => change(() => api.cancel(id), caseTags),
        transition: (id, status, texto, foto) => change(() => api.transition(id, status, texto, foto), caseTags),
        publish: (id, approved, motivo) => change(() => api.publish(id, approved, motivo), caseTags),
        schedule: (id, inicio, fim) => change(() => api.schedule(id, inicio, fim), caseTags),
        link: (id, principalId, motivo) => change(() => api.link(id, principalId, motivo), caseTags),
        comment: (id, texto, internal) => change(() => api.comment(id, texto, internal), caseTags),
      },
      markRead: id => change(() => api.markRead(id), ['notices']),
      updateProfile: input => change(() => saveProfile(input), ['cases']),
      address: cep => execute(() => api.address(cep)),
      geocode: address => execute(() => api.geocode(address)),
    };
  }, [api, cache, execute, saveProfile]);
  return <DataContext value={value}>{children}</DataContext>;
}

function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('DataProvider ausente');
  return context;
}

function useQuery<T>(key: string, load: () => Promise<T>, tags: readonly string[], enabled = true) {
  const { cache } = useData();
  const { execute, ready } = useSession();
  const active = ready && enabled;
  const subscribe = useCallback((listener: () => void) => active ? cache.subscribe(key, listener) : () => {}, [cache, key, active]);
  const snapshot = useCallback(() => active ? cache.snapshot<T>(key) : idle as QueryState<T>, [cache, key, active]);
  const state = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => {
    if (active) void cache.fetch(key, () => execute(load), tags);
  }, [cache, key, active, execute, load, tags]);
  const retry = useCallback(() => { if (active) cache.retry(key); }, [cache, key, active]);
  return { ...state, loading: !ready || state.loading, retry };
}

// Filtros equivalentes geram a mesma consulta, independentemente da ordem das chaves.
function filterKey(filters: Filters = {}) {
  return JSON.stringify(Object.entries(filters).filter(([, value]) => value).sort(([a], [b]) => a.localeCompare(b)));
}
const casesOnly = ['cases'];
const noticesOnly = ['notices'];
const indicatorsOnly = ['indicators'];
const catalogueOnly = ['catalogue'];

export function useCases(scope: Scope, filters?: Filters) {
  const api = useApi();
  const { user } = useAuth();
  const key = filterKey(filters);
  const load = useCallback(() => api.list(scope, Object.fromEntries(JSON.parse(key))), [api, scope, key]);
  const enabled = scope === 'public' || (scope === 'mine' ? user?.perfil === 'CIDADAO' : user?.perfil === 'SABESP');
  return useQuery<Case[]>(`cases:list:${scope}:${key}`, load, casesOnly, enabled);
}

export function useCase(id: string | undefined, scope: Scope) {
  const api = useApi();
  const { user } = useAuth();
  const load = useCallback(() => api.detail(id!, scope), [api, id, scope]);
  const enabled = Boolean(id) && (scope === 'public' || (scope === 'staff' ? user?.perfil === 'SABESP' : Boolean(user)));
  return useQuery<Case>(`cases:detail:${scope}:${id}`, load, casesOnly, enabled);
}

export function useCaseTypes() {
  const api = useApi();
  const load = useCallback(() => api.types(), [api]);
  return useQuery('catalogue:types', load, catalogueOnly);
}

export function useNotices() {
  const api = useApi();
  const { user } = useAuth();
  const { markRead } = useData();
  const load = useCallback(() => api.notices(), [api]);
  return { ...useQuery<Notice[]>('notices', load, noticesOnly, user?.perfil === 'CIDADAO'), markRead };
}

export function useIndicators(filters?: Filters) {
  const api = useApi();
  const { user } = useAuth();
  const key = filterKey(filters);
  const load = useCallback(() => api.indicators(Object.fromEntries(JSON.parse(key))), [api, key]);
  return useQuery<Indicators>(`indicators:${key}`, load, indicatorsOnly, user?.perfil === 'PREFEITURA');
}

export function useCaseActions() { return useData().cases; }
export function useProfileActions() { const { updateProfile } = useData(); return { updateProfile }; }
export function useAddressActions() { const { address, geocode } = useData(); return { address, geocode }; }
