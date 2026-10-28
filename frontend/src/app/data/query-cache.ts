import type { ApiError } from '../../shared/errors/ApiError.ts';
import { toApiError } from '../../shared/errors/ApiError.ts';

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  failure: ApiError | null;
}

interface Entry {
  state: QueryState<unknown>;
  tags: readonly string[];
  listeners: Set<() => void>;
  load?: () => Promise<unknown>;
  pending?: Promise<void>;
  version: number;
  stale: boolean;
  updatedAt: number;
}

export class QueryCache {
  private entries = new Map<string, Entry>();

  private entry(key: string): Entry {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = {
        state: { data: null, loading: true, error: '', failure: null },
        tags: [],
        listeners: new Set(),
        version: 0,
        stale: true,
        updatedAt: 0,
      };
      this.entries.set(key, entry);
    }
    return entry;
  }

  snapshot<T>(key: string): QueryState<T> {
    return this.entry(key).state as QueryState<T>;
  }

  subscribe(key: string, listener: () => void): () => void {
    const entry = this.entry(key);
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
    };
  }

  private emit(entry: Entry) {
    entry.listeners.forEach((listener) => listener());
  }

  fetch<T>(key: string, load: () => Promise<T>, tags: readonly string[]): Promise<void> {
    const entry = this.entry(key);
    entry.load = load;
    entry.tags = tags;
    if (entry.pending) return entry.pending;
    if (!entry.stale && Date.now() - entry.updatedAt < 30_000) return Promise.resolve();
    const version = ++entry.version;
    entry.stale = false;
    entry.state = { ...entry.state, loading: true, error: '', failure: null };
    this.emit(entry);
    const pending = Promise.resolve()
      .then(load)
      .then(
        (data) => {
          if (entry.version !== version) return;
          entry.state = { data, loading: false, error: '', failure: null };
          entry.updatedAt = Date.now();
          entry.pending = undefined;
          this.emit(entry);
        },
        (error) => {
          if (entry.version !== version) return;
          const failure = toApiError(error);
          entry.state = { data: null, loading: false, error: failure.message, failure };
          entry.updatedAt = Date.now();
          entry.pending = undefined;
          this.emit(entry);
        },
      );
    entry.pending = pending;
    return pending;
  }

  private refresh(entry: Entry) {
    ++entry.version;
    entry.pending = undefined;
    entry.stale = true;
    entry.state = { ...entry.state, loading: true, error: '', failure: null };
    this.emit(entry);
  }

  invalidate(tags: readonly string[]) {
    for (const [key, entry] of this.entries) {
      if (!entry.tags.some((tag) => tags.includes(tag))) continue;
      this.refresh(entry);
      if (entry.listeners.size && entry.load) void this.fetch(key, entry.load, entry.tags);
    }
  }

  retry(key: string) {
    const entry = this.entry(key);
    this.refresh(entry);
    if (entry.load) void this.fetch(key, entry.load, entry.tags);
  }
}
