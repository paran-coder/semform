const DB_NAME = "semform";
const DB_VERSION = 1;

export const STORES = {
  profile: "profile",
  clients: "clients",
  pricingPresets: "pricingPresets",
  termPresets: "termPresets",
  quotes: "quotes",
  settings: "settings",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

function canUseIndexedDB() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export function openSemformDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDB()) {
      reject(new Error("이 브라우저에서는 IndexedDB를 사용할 수 없습니다."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("로컬 데이터베이스를 열지 못했습니다."));
  });
}

export async function getRecord<T>(storeName: StoreName, id: IDBValidKey): Promise<T | null> {
  const db = await openSemformDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(id);

    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("데이터를 불러오지 못했습니다."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const db = await openSemformDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();

    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error("데이터 목록을 불러오지 못했습니다."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
}

export async function putRecord<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openSemformDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("데이터를 저장하지 못했습니다."));
    };
  });
}

export async function deleteRecord(storeName: StoreName, id: IDBValidKey): Promise<void> {
  const db = await openSemformDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("데이터를 삭제하지 못했습니다."));
    };
  });
}


export async function replaceAllStoreRecords(records: Record<StoreName, unknown[]>): Promise<void> {
  const db = await openSemformDB();
  const storeNames = Object.values(STORES);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, "readwrite");
    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName);
      store.clear();
      for (const record of records[storeName] ?? []) store.put(record);
    }
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("백업 데이터를 복원하지 못했습니다."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("백업 데이터 복원이 중단되었습니다."));
    };
  });
}


export async function clearAllStoreRecords(): Promise<void> {
  const db = await openSemformDB();
  const storeNames = Object.values(STORES);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, "readwrite");
    for (const storeName of storeNames) transaction.objectStore(storeName).clear();
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("로컬 데이터를 초기화하지 못했습니다."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("로컬 데이터 초기화가 중단되었습니다."));
    };
  });
}
