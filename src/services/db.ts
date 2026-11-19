/** Minimal promise-based IndexedDB wrapper (no dependency). */
const DB_NAME = 'lifepath';
const DB_VERSION = 1;
export const STORE_SAVES = 'saves';
export const STORE_META = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SAVES)) db.createObjectStore(STORE_SAVES);
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
      }),
  );
}

export const idb = {
  get: <T>(store: string, key: IDBValidKey) => tx<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>),
  put: (store: string, key: IDBValidKey, value: unknown) => tx<IDBValidKey>(store, 'readwrite', (s) => s.put(value, key)),
  delete: (store: string, key: IDBValidKey) => tx<undefined>(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>),
  keys: (store: string) => tx<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys()),
};

/** Test helper: forget the cached connection (fake-indexeddb resets between tests). */
export function resetDbConnection(): void {
  dbPromise = null;
}
