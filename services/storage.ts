
import { SermonProject, SermonSeries, TheologicalProfile, DEFAULT_PROFILE, CustomPrompt } from '../types';

// ==========================================
// Storage Configuration
// ==========================================
export type StorageType = 'local' | 'indexeddb';

export interface StorageAdapter {
  type: StorageType;
  init(): Promise<void>;
  
  // Projects
  loadProjects(): Promise<SermonProject[]>;
  saveProject(project: SermonProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
  
  // Series
  loadSeries(): Promise<SermonSeries[]>;
  saveSeries(series: SermonSeries): Promise<void>;
  deleteSeries(id: string): Promise<void>;
  
  // User Profile
  loadProfile(): Promise<TheologicalProfile>;
  saveProfile(profile: TheologicalProfile): Promise<void>;

  // Custom Prompts
  loadCustomPrompts(): Promise<CustomPrompt[]>;
  saveCustomPrompt(prompt: CustomPrompt): Promise<void>;
  deleteCustomPrompt(id: string): Promise<void>;
}

// ==========================================
// IndexedDB Implementation
// ==========================================
const DB_NAME = 'SermonAI_DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SERIES = 'series';
const STORE_PROMPTS = 'custom_prompts';
const STORE_SETTINGS = 'settings'; // For Profile and other key-value settings

class IndexedDBAdapterImpl implements StorageAdapter {
  type: StorageType = 'indexeddb';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = request.result;
        console.log("IndexedDB Initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Projects Store
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        
        // Series Store
        if (!db.objectStoreNames.contains(STORE_SERIES)) {
          db.createObjectStore(STORE_SERIES, { keyPath: 'id' });
        }

        // Custom Prompts Store
        if (!db.objectStoreNames.contains(STORE_PROMPTS)) {
          db.createObjectStore(STORE_PROMPTS, { keyPath: 'id' });
        }

        // Settings Store (Profile)
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
        }
      };
    });
  }

  // Helper to execute IDB requests in a Promise
  private async runTransaction<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => IDBRequest<any>
  ): Promise<T> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      
      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Projects ---
  async loadProjects(): Promise<SermonProject[]> {
    return this.runTransaction<SermonProject[]>(STORE_PROJECTS, 'readonly', (store) => store.getAll());
  }

  async saveProject(project: SermonProject): Promise<void> {
    return this.runTransaction(STORE_PROJECTS, 'readwrite', (store) => store.put(project));
  }

  async deleteProject(id: string): Promise<void> {
    return this.runTransaction(STORE_PROJECTS, 'readwrite', (store) => store.delete(id));
  }

  // --- Series ---
  async loadSeries(): Promise<SermonSeries[]> {
    return this.runTransaction<SermonSeries[]>(STORE_SERIES, 'readonly', (store) => store.getAll());
  }

  async saveSeries(series: SermonSeries): Promise<void> {
    return this.runTransaction(STORE_SERIES, 'readwrite', (store) => store.put(series));
  }

  async deleteSeries(id: string): Promise<void> {
    return this.runTransaction(STORE_SERIES, 'readwrite', (store) => store.delete(id));
  }

  // --- Profile ---
  // Stored as a single object with id: 'profile' in settings store
  async loadProfile(): Promise<TheologicalProfile> {
    try {
      const result = await this.runTransaction<{ id: string, value: TheologicalProfile }>(
        STORE_SETTINGS, 
        'readonly', 
        (store) => store.get('profile')
      );
      return result ? result.value : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  }

  async saveProfile(profile: TheologicalProfile): Promise<void> {
    return this.runTransaction(
      STORE_SETTINGS, 
      'readwrite', 
      (store) => store.put({ id: 'profile', value: profile })
    );
  }

  // --- Custom Prompts ---
  async loadCustomPrompts(): Promise<CustomPrompt[]> {
    return this.runTransaction<CustomPrompt[]>(STORE_PROMPTS, 'readonly', (store) => store.getAll());
  }

  async saveCustomPrompt(prompt: CustomPrompt): Promise<void> {
    return this.runTransaction(STORE_PROMPTS, 'readwrite', (store) => store.put(prompt));
  }

  async deleteCustomPrompt(id: string): Promise<void> {
    return this.runTransaction(STORE_PROMPTS, 'readwrite', (store) => store.delete(id));
  }
}

// ==========================================
// Storage Factory
// ==========================================
class StorageManager {
  private adapter: StorageAdapter;

  constructor() {
    this.adapter = new IndexedDBAdapterImpl();
  }

  async initialize(): Promise<void> {
     this.adapter = new IndexedDBAdapterImpl();
     await this.adapter.init();
     console.log("Storage initialized with IndexedDB (Offline Persistence)");
  }

  getAdapter(): StorageAdapter {
    return this.adapter;
  }
}

export const storageManager = new StorageManager();
