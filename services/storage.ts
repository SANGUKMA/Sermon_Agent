
import { SermonProject, SermonSeries, TheologicalProfile, DEFAULT_PROFILE, CustomPrompt } from '../types';
import { supabase } from './supabaseClient';

// ==========================================
// Storage Configuration
// ==========================================
export type StorageType = 'local' | 'indexeddb' | 'supabase';

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
// Supabase Implementation
// ==========================================

// camelCase → snake_case helpers
function projectToRow(p: SermonProject, userId: string): Record<string, unknown> {
  return {
    id: p.id,
    user_id: userId,
    title: p.title,
    passage: p.passage,
    theme: p.theme,
    audience: p.audience,
    audience_context: p.audienceContext,
    sermon_goal: p.sermonGoal,
    structure: p.structure,
    historical_context: p.historicalContext,
    original_language: p.originalLanguage,
    theological_themes: p.theologicalThemes,
    text_analysis: p.textAnalysis,
    hermeneutics: p.hermeneutics,
    journal: p.journal,
    meditation_entries: p.meditationEntries,
    application_points: p.applicationPoints,
    draft: p.draft,
    draft_versions: p.draftVersions,
    notes: p.notes,
    preaching_settings: p.preachingSettings,
    editor_settings: p.editorSettings,
    version: p.version,
    mode: p.mode,
    status: p.status,
    date: p.date || null,
    series_id: p.seriesId || null,
    is_deleted: p.isDeleted ?? false,
    deleted_at: p.deletedAt ?? null,
    is_locked: p.isLocked ?? false,
    last_modified: p.lastModified,
  };
}

// snake_case → camelCase
function rowToProject(r: any): SermonProject {
  return {
    id: r.id,
    title: r.title ?? '',
    passage: r.passage ?? '',
    theme: r.theme ?? '',
    audience: r.audience ?? '',
    audienceContext: r.audience_context ?? {},
    sermonGoal: r.sermon_goal ?? '',
    structure: r.structure ?? '',
    historicalContext: r.historical_context ?? '',
    originalLanguage: r.original_language ?? '',
    theologicalThemes: r.theological_themes ?? '',
    textAnalysis: r.text_analysis ?? [],
    hermeneutics: r.hermeneutics ?? [],
    journal: r.journal ?? '',
    meditationEntries: r.meditation_entries ?? [],
    applicationPoints: r.application_points ?? '',
    draft: r.draft ?? '',
    draftVersions: r.draft_versions ?? [],
    notes: r.notes ?? '',
    preachingSettings: r.preaching_settings ?? { speechRate: 'normal', targetTime: 20 },
    editorSettings: r.editor_settings ?? { backgroundColor: '#ffffff', fontSize: 18, lineHeight: 1.8 },
    version: r.version ?? 1,
    mode: r.mode ?? 'deep',
    status: r.status ?? 'planning',
    lastModified: r.last_modified ?? Date.now(),
    date: r.date ?? undefined,
    seriesId: r.series_id ?? undefined,
    isDeleted: r.is_deleted ?? false,
    deletedAt: r.deleted_at ?? undefined,
    isLocked: r.is_locked ?? false,
  };
}

function seriesToRow(s: SermonSeries, userId: string): Record<string, unknown> {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    description: s.description,
    last_modified: s.lastModified,
  };
}

function rowToSeries(r: any): SermonSeries {
  return {
    id: r.id,
    title: r.title ?? '',
    description: r.description ?? '',
    lastModified: r.last_modified ?? Date.now(),
  };
}

class SupabaseAdapterImpl implements StorageAdapter {
  type: StorageType = 'supabase';
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async init(): Promise<void> {
    console.log('Supabase adapter initialized for user:', this.userId);
  }

  // --- Projects ---
  async loadProjects(): Promise<SermonProject[]> {
    const { data, error } = await supabase
      .from('sermon_projects')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_modified', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToProject);
  }

  async saveProject(project: SermonProject): Promise<void> {
    const row = projectToRow(project, this.userId);
    const { error } = await supabase
      .from('sermon_projects')
      .upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('sermon_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);
    if (error) throw error;
  }

  // --- Series ---
  async loadSeries(): Promise<SermonSeries[]> {
    const { data, error } = await supabase
      .from('sermon_series')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_modified', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToSeries);
  }

  async saveSeries(series: SermonSeries): Promise<void> {
    const row = seriesToRow(series, this.userId);
    const { error } = await supabase
      .from('sermon_series')
      .upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async deleteSeries(id: string): Promise<void> {
    const { error } = await supabase
      .from('sermon_series')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);
    if (error) throw error;
  }

  // --- Profile ---
  async loadProfile(): Promise<TheologicalProfile> {
    const { data, error } = await supabase
      .from('theological_profiles')
      .select('*')
      .eq('user_id', this.userId)
      .single();
    if (error || !data) return DEFAULT_PROFILE;
    return {
      denomination: data.denomination ?? '',
      style: data.style ?? '',
      avoidance: data.avoidance ?? '',
      guardrail: data.guardrail ?? '',
      preferredStructure: data.preferred_structure ?? '',
      defaultAudience: data.default_audience ?? undefined,
    };
  }

  async saveProfile(profile: TheologicalProfile): Promise<void> {
    const row = {
      user_id: this.userId,
      denomination: profile.denomination,
      style: profile.style,
      avoidance: profile.avoidance,
      guardrail: profile.guardrail ?? '',
      preferred_structure: profile.preferredStructure ?? '',
      default_audience: profile.defaultAudience ?? {},
      last_modified: Date.now(),
    };
    const { error } = await supabase
      .from('theological_profiles')
      .upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
  }

  // --- Custom Prompts ---
  async loadCustomPrompts(): Promise<CustomPrompt[]> {
    const { data, error } = await supabase
      .from('custom_prompts')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_modified', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      title: r.title ?? '',
      content: r.content ?? '',
    }));
  }

  async saveCustomPrompt(prompt: CustomPrompt): Promise<void> {
    const row = {
      id: prompt.id,
      user_id: this.userId,
      title: prompt.title,
      content: prompt.content,
      last_modified: Date.now(),
    };
    const { error } = await supabase
      .from('custom_prompts')
      .upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async deleteCustomPrompt(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);
    if (error) throw error;
  }
}

// ==========================================
// Merge Local → Cloud
// ==========================================
export async function mergeLocalToCloud(
  localAdapter: StorageAdapter,
  cloudAdapter: StorageAdapter
): Promise<void> {
  console.log('[Sync] Merging local data to cloud...');

  // --- Projects ---
  const [localProjects, cloudProjects] = await Promise.all([
    localAdapter.loadProjects(),
    cloudAdapter.loadProjects(),
  ]);
  const cloudProjectMap = new Map(cloudProjects.map(p => [p.id, p]));
  for (const local of localProjects) {
    const cloud = cloudProjectMap.get(local.id);
    if (!cloud || local.lastModified > cloud.lastModified) {
      await cloudAdapter.saveProject(local);
    }
  }

  // --- Series ---
  const [localSeries, cloudSeries] = await Promise.all([
    localAdapter.loadSeries(),
    cloudAdapter.loadSeries(),
  ]);
  const cloudSeriesMap = new Map(cloudSeries.map(s => [s.id, s]));
  for (const local of localSeries) {
    const cloud = cloudSeriesMap.get(local.id);
    if (!cloud || local.lastModified > cloud.lastModified) {
      await cloudAdapter.saveSeries(local);
    }
  }

  // --- Profile (overwrite if local is non-default) ---
  const localProfile = await localAdapter.loadProfile();
  if (localProfile.denomination !== DEFAULT_PROFILE.denomination ||
      localProfile.style !== DEFAULT_PROFILE.style) {
    await cloudAdapter.saveProfile(localProfile);
  }

  // --- Custom Prompts ---
  const [localPrompts, cloudPrompts] = await Promise.all([
    localAdapter.loadCustomPrompts(),
    cloudAdapter.loadCustomPrompts(),
  ]);
  const cloudPromptMap = new Map(cloudPrompts.map(p => [p.id, p]));
  for (const local of localPrompts) {
    if (!cloudPromptMap.has(local.id)) {
      await cloudAdapter.saveCustomPrompt(local);
    }
  }

  console.log('[Sync] Merge complete.');
}

// ==========================================
// Storage Factory
// ==========================================
class StorageManager {
  private adapter: StorageAdapter;
  private localAdapter: IndexedDBAdapterImpl;

  constructor() {
    this.localAdapter = new IndexedDBAdapterImpl();
    this.adapter = this.localAdapter;
  }

  async initialize(): Promise<void> {
     this.localAdapter = new IndexedDBAdapterImpl();
     this.adapter = this.localAdapter;
     await this.adapter.init();
     console.log("Storage initialized with IndexedDB (Offline Persistence)");
  }

  getAdapter(): StorageAdapter {
    return this.adapter;
  }

  getLocalAdapter(): StorageAdapter {
    return this.localAdapter;
  }

  async switchToSupabase(userId: string): Promise<StorageAdapter> {
    const supabaseAdapter = new SupabaseAdapterImpl(userId);
    await supabaseAdapter.init();
    this.adapter = supabaseAdapter;
    console.log('Storage switched to Supabase (Cloud Sync)');
    return supabaseAdapter;
  }

  switchToLocal(): void {
    this.adapter = this.localAdapter;
    console.log('Storage switched back to IndexedDB (Local)');
  }
}

export const storageManager = new StorageManager();
