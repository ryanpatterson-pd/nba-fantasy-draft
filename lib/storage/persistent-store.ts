import { readJson, removeKey, writeJson } from './local';

/**
 * A localStorage-backed external store, designed for `useSyncExternalStore`.
 *
 * Reading persisted state inside an effect and calling setState causes a
 * cascading render (and is flagged by the React Compiler lint rules). Modelling
 * localStorage as what it actually is — an external store — solves that
 * properly: `getServerSnapshot` supplies the value used for SSR and hydration,
 * then React re-renders once with the real client value.
 *
 * Bonus: a `storage` listener keeps two tabs on the same laptop in sync, which
 * matters when draft night is running on a second screen.
 */
export type PersistentStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (updater: T | ((previous: T) => T)) => void;
  reset: () => void;
};

export type PersistentStoreOptions<T> = {
  /** Transform before writing, e.g. to add a precomputed cache alongside. */
  serialize?: (value: T) => unknown;
  /** Validate and transform after reading. Return null to fall back. */
  deserialize?: (raw: unknown) => T | null;
};

export function createPersistentStore<T>(
  key: string,
  fallback: T,
  options: PersistentStoreOptions<T> = {},
): PersistentStore<T> {
  let snapshot: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();
  let detachStorageListener: (() => void) | null = null;

  function load(): T {
    const raw = readJson<unknown>(key);
    if (raw === null) return fallback;
    const parsed = options.deserialize ? options.deserialize(raw) : (raw as T);
    return parsed ?? fallback;
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function getSnapshot(): T {
    if (!loaded) {
      snapshot = load();
      loaded = true;
    }
    return snapshot;
  }

  function getServerSnapshot(): T {
    return fallback;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    if (!detachStorageListener && typeof window !== 'undefined') {
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return;
        snapshot = load();
        loaded = true;
        emit();
      };
      window.addEventListener('storage', onStorage);
      detachStorageListener = () => window.removeEventListener('storage', onStorage);
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && detachStorageListener) {
        detachStorageListener();
        detachStorageListener = null;
      }
    };
  }

  function set(updater: T | ((previous: T) => T)): void {
    const current = getSnapshot();
    const next =
      typeof updater === 'function' ? (updater as (previous: T) => T)(current) : updater;
    if (next === current) return;

    snapshot = next;
    loaded = true;
    writeJson(key, options.serialize ? options.serialize(next) : next);
    emit();
  }

  function reset(): void {
    snapshot = fallback;
    loaded = true;
    removeKey(key);
    emit();
  }

  return { subscribe, getSnapshot, getServerSnapshot, set, reset };
}
