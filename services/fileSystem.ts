
// Simple IndexedDB wrapper for storing FileSystemHandles
const DB_NAME = 'CakeDudesDB';
const STORE_NAME = 'handles';

export const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveDirectoryHandle = async (handle: any) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(handle, 'defaultDir');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getDirectoryHandle = async (): Promise<any | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('defaultDir');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const verifyPermission = async (handle: any, readWrite: boolean) => {
  const options = { mode: readWrite ? 'readwrite' : 'read' };
  try {
    // Check if permission was already granted
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }
    // Request permission
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
  } catch (e) {
      console.warn("Permission check failed (likely iframe/preview restriction):", e);
      return false;
  }
};