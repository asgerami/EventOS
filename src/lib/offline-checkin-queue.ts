/**
 * Client-side offline check-in queue (IndexedDB).
 * Used when check-in POST fails due to network; items are synced when back online.
 */

const DB_NAME = "eventos-offline";
const STORE = "checkin-queue";
const DB_VERSION = 1;

export type QueuedCheckIn = {
  id: string;
  eventId: string;
  stationId: string;
  token: string;
  method: "manual" | "qr_scan" | "nfc";
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export function addToOfflineQueue(item: Omit<QueuedCheckIn, "id" | "createdAt">): Promise<void> {
  const record: QueuedCheckIn = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  });
}

export function getOfflineQueue(): Promise<QueuedCheckIn[]> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => { db.close(); resolve(req.result || []); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

export function removeFromOfflineQueue(id: string): Promise<void> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  });
}

export function getOfflineQueueCount(): Promise<number> {
  return getOfflineQueue().then((arr) => arr.length);
}
