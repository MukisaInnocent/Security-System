const DB_NAME = 'wedeployed-offline';
const DB_VERSION = 2;

interface OfflineRecord {
  id: string;
  type: 'attendance' | 'incident';
  data: any;
  timestamp: string;
  synced: boolean;
}

export interface OfflineChatMessage {
  id: string;
  conversationId: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
  replyToId?: string;
  timestamp: string;
  sent: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('chatQueue')) {
        const chatStore = db.createObjectStore('chatQueue', { keyPath: 'id' });
        chatStore.createIndex('sent', 'sent', { unique: false });
        chatStore.createIndex('conversationId', 'conversationId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToOfflineQueue(record: OfflineRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineQueue', 'readwrite');
    tx.objectStore('offlineQueue').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUnsynced(type?: string): Promise<OfflineRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineQueue', 'readonly');
    const store = tx.objectStore('offlineQueue');
    const request = store.getAll();
    request.onsuccess = () => {
      let results = request.result.filter((r: OfflineRecord) => !r.synced);
      if (type) results = results.filter((r: OfflineRecord) => r.type === type);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function markSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.synced = true;
        store.put(record);
      }
      tx.oncomplete = () => resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearSynced(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineQueue', 'readwrite');
    const store = tx.objectStore('offlineQueue');
    const request = store.getAll();
    request.onsuccess = () => {
      const records = request.result.filter((r: OfflineRecord) => r.synced);
      records.forEach((r: OfflineRecord) => store.delete(r.id));
      tx.oncomplete = () => resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheData(key: string, data: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedData', 'readwrite');
    tx.objectStore('cachedData').put({ key, data, cachedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedData(key: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedData', 'readonly');
    const request = tx.objectStore('cachedData').get(key);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
}

export function generateOfflineId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Chat offline queue ─────────────────────────────────────────
export async function addChatToQueue(message: OfflineChatMessage): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatQueue', 'readwrite');
    tx.objectStore('chatQueue').put(message);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUnsentChatMessages(): Promise<OfflineChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatQueue', 'readonly');
    const request = tx.objectStore('chatQueue').getAll();
    request.onsuccess = () => {
      resolve(request.result.filter((m: OfflineChatMessage) => !m.sent));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function markChatMessageSent(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatQueue', 'readwrite');
    const store = tx.objectStore('chatQueue');
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.sent = true;
        store.put(record);
      }
      tx.oncomplete = () => resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearSentChatMessages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chatQueue', 'readwrite');
    const store = tx.objectStore('chatQueue');
    const request = store.getAll();
    request.onsuccess = () => {
      const records = request.result.filter((m: OfflineChatMessage) => m.sent);
      records.forEach((r: OfflineChatMessage) => store.delete(r.id));
      tx.oncomplete = () => resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

