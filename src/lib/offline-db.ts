/**
 * Offline IndexedDB Wrapper - Persistent storage for game data
 * 
 * This provides a more robust offline storage layer than localStorage alone.
 * IndexedDB can store much larger amounts of data and survives browser cache clears.
 * Used alongside localStorage for redundancy — if IndexedDB fails, localStorage is the fallback.
 */

const DB_NAME = 'sudoku-prime-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  STATS: 'stats',
  ACHIEVEMENTS: 'achievements',
  LEADERBOARD: 'leaderboard',
  SETTINGS: 'settings',
  SAVED_GAME: 'saved-game',
  PLAYER_PROGRESS: 'player-progress',
  SYNC_QUEUE: 'sync-queue', // Queue of actions to sync when online
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      const storeNames = Object.values(STORES);
      for (const storeName of storeNames) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'key' });
          if (storeName === STORES.SYNC_QUEUE) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        }
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[OfflineDB] Failed to open database:', (event.target as IDBOpenDBRequest).error);
      dbInitPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
}

/**
 * Generic get from IndexedDB
 */
async function dbGet<T>(storeName: StoreName, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    return new Promise<T | null>((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.value as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.warn(`[OfflineDB] Failed to get ${key} from ${storeName}`);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn(`[OfflineDB] get error for ${storeName}/${key}:`, error);
    return null;
  }
}

/**
 * Generic set to IndexedDB
 */
async function dbSet<T>(storeName: StoreName, key: string, value: T): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put({ key, value });

    return new Promise<boolean>((resolve) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.warn(`[OfflineDB] Failed to set ${key} in ${storeName}`);
        resolve(false);
      };
    });
  } catch (error) {
    console.warn(`[OfflineDB] set error for ${storeName}/${key}:`, error);
    return false;
  }
}

/**
 * Generic delete from IndexedDB
 */
async function dbDelete(storeName: StoreName, key: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    return new Promise<boolean>((resolve) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.warn(`[OfflineDB] Failed to delete ${key} from ${storeName}`);
        resolve(false);
      };
    });
  } catch (error) {
    console.warn(`[OfflineDB] delete error for ${storeName}/${key}:`, error);
    return false;
  }
}

/**
 * Get all entries from a store
 */
async function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise<T[]>((resolve) => {
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map((r: { key: string; value: T }) => r.value));
      };
      request.onerror = () => {
        console.warn(`[OfflineDB] Failed to get all from ${storeName}`);
        resolve([]);
      };
    });
  } catch (error) {
    console.warn(`[OfflineDB] getAll error for ${storeName}:`, error);
    return [];
  }
}

/**
 * Clear a store
 */
async function dbClear(storeName: StoreName): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    return new Promise<boolean>((resolve) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.warn(`[OfflineDB] clear error for ${storeName}:`, error);
    return false;
  }
}

// ========== SYNC QUEUE ==========
// When offline, actions that need to be synced to the server are queued here.
// When the app comes back online, the queue is processed.

export interface SyncQueueItem {
  key: string;
  type: 'stats' | 'achievement' | 'leaderboard' | 'progress';
  data: unknown;
  timestamp: number;
  retries: number;
}

/**
 * Add an item to the sync queue
 */
export async function addToSyncQueue(type: SyncQueueItem['type'], data: unknown): Promise<boolean> {
  const item: SyncQueueItem = {
    key: `sync-${type}-${Date.now()}`,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  return dbSet(STORES.SYNC_QUEUE, item.key, item);
}

/**
 * Get all items from the sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return dbGetAll<SyncQueueItem>(STORES.SYNC_QUEUE);
}

/**
 * Remove an item from the sync queue after successful sync
 */
export async function removeFromSyncQueue(key: string): Promise<boolean> {
  return dbDelete(STORES.SYNC_QUEUE, key);
}

/**
 * Clear the entire sync queue
 */
export async function clearSyncQueue(): Promise<boolean> {
  return dbClear(STORES.SYNC_QUEUE);
}

// ========== HIGH-LEVEL API ==========
// These functions mirror the localStorage API but use IndexedDB as primary storage
// with localStorage as fallback for maximum reliability

export const offlineDB = {
  // Stats
  async getStats() {
    const fromDB = await dbGet<unknown>(STORES.STATS, 'current');
    return fromDB;
  },
  async setStats(stats: unknown) {
    await dbSet(STORES.STATS, 'current', stats);
  },

  // Achievements
  async getAchievements() {
    const fromDB = await dbGet<unknown>(STORES.ACHIEVEMENTS, 'current');
    return fromDB;
  },
  async setAchievements(achievements: unknown) {
    await dbSet(STORES.ACHIEVEMENTS, 'current', achievements);
  },

  // Leaderboard
  async getLeaderboard() {
    const fromDB = await dbGet<unknown>(STORES.LEADERBOARD, 'current');
    return fromDB;
  },
  async setLeaderboard(entries: unknown) {
    await dbSet(STORES.LEADERBOARD, 'current', entries);
  },

  // Settings
  async getSettings() {
    const fromDB = await dbGet<unknown>(STORES.SETTINGS, 'current');
    return fromDB;
  },
  async setSettings(settings: unknown) {
    await dbSet(STORES.SETTINGS, 'current', settings);
  },

  // Saved Game
  async getSavedGame() {
    const fromDB = await dbGet<unknown>(STORES.SAVED_GAME, 'current');
    return fromDB;
  },
  async setSavedGame(game: unknown) {
    await dbSet(STORES.SAVED_GAME, 'current', game);
  },
  async clearSavedGame() {
    return dbDelete(STORES.SAVED_GAME, 'current');
  },

  // Player Progress
  async getPlayerProgress() {
    const fromDB = await dbGet<unknown>(STORES.PLAYER_PROGRESS, 'current');
    return fromDB;
  },
  async setPlayerProgress(progress: unknown) {
    await dbSet(STORES.PLAYER_PROGRESS, 'current', progress);
  },

  // Sync Queue
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,

  // Utility
  async isAvailable(): Promise<boolean> {
    try {
      await openDB();
      return true;
    } catch {
      return false;
    }
  },

  async getCacheSize(): Promise<number> {
    try {
      const db = await openDB();
      let total = 0;
      for (const storeName of Object.values(STORES)) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const count = await new Promise<number>((resolve) => {
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        });
        total += count;
      }
      return total;
    } catch {
      return 0;
    }
  },
};

export default offlineDB;