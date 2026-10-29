import { DictionaryEntry } from '../types/dictionary';
import { bibleDictionaryEntries } from '../data/seedData';
import { newBible20Entries } from '../data/seedDataBatch2';
import { newBibleBatch3Entries } from '../data/seedDataBatch3';

const FIREBASE_DB_URL = 'https://mmbbdictionary.firebaseio.com';

// Combined master list of all available high-quality curated Bible entries
export const allAvailableSeedEntries: DictionaryEntry[] = [
  ...newBibleBatch3Entries, // 20 brand-new words ready for next auto-upload click!
  ...newBible20Entries,
  ...bibleDictionaryEntries
];

export const firebaseService = {
  /**
   * Fetch all dictionary entries from Firebase
   */
  async getDictionary(): Promise<Record<string, DictionaryEntry>> {
    try {
      const response = await fetch(`${FIREBASE_DB_URL}/dictionary.json`);
      if (!response.ok) throw new Error('Failed to fetch from Firebase');
      const data = await response.json();
      return data || {};
    } catch (err) {
      console.warn('Firebase getDictionary failed, returning empty:', err);
      return {};
    }
  },

  /**
   * Fetch current admin password from Firebase
   */
  async getAdminPassword(): Promise<string> {
    try {
      const response = await fetch(`${FIREBASE_DB_URL}/settings/adminPassword.json`);
      if (!response.ok) return 'iamo';
      const pwd = await response.json();
      return pwd || 'iamo';
    } catch (err) {
      return 'iamo';
    }
  },

  /**
   * Update admin password in Firebase
   */
  async setAdminPassword(newPassword: string): Promise<boolean> {
    const response = await fetch(`${FIREBASE_DB_URL}/settings/adminPassword.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPassword)
    });
    return response.ok;
  },

  /**
   * Add a new entry to Firebase
   */
  async addEntry(entry: Omit<DictionaryEntry, 'id'>): Promise<string> {
    const payload = {
      ...entry,
      updatedAt: Date.now()
    };
    const response = await fetch(`${FIREBASE_DB_URL}/dictionary.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to add entry to Firebase');
    const result = await response.json();
    return result.name;
  },

  /**
   * Update an existing entry
   */
  async updateEntry(id: string, entry: Partial<DictionaryEntry>): Promise<boolean> {
    const payload = {
      ...entry,
      updatedAt: Date.now()
    };
    const response = await fetch(`${FIREBASE_DB_URL}/dictionary/${id}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  },

  /**
   * Delete an entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    const response = await fetch(`${FIREBASE_DB_URL}/dictionary/${id}.json`, {
      method: 'DELETE'
    });
    return response.ok;
  },

  /**
   * Seed / Auto-Add unadded dictionary data into Firebase
   * @param countToUpload Number of unadded entries to add (defaults to 20)
   * @param onProgress Callback with progress info
   */
  async seedBibleData(
    countToUpload: number = 20,
    onProgress?: (current: number, total: number, title: string) => void
  ): Promise<{ added: number; skipped: number; addedTitles: string[] }> {
    const existing = await this.getDictionary();
    const existingTitles = new Set(
      Object.values(existing)
        .filter(Boolean)
        .map(e => e.title?.trim().toLowerCase())
    );

    // Filter candidate entries that are not in the database yet
    const unaddedEntries: DictionaryEntry[] = [];
    for (const item of allAvailableSeedEntries) {
      if (!existingTitles.has(item.title.trim().toLowerCase())) {
        unaddedEntries.push(item);
      }
    }

    const targetList = unaddedEntries.slice(0, countToUpload);
    const totalToUpload = targetList.length;

    let added = 0;
    const addedTitles: string[] = [];

    if (totalToUpload === 0) {
      return { added: 0, skipped: existingTitles.size, addedTitles: [] };
    }

    for (let i = 0; i < totalToUpload; i++) {
      const entry = targetList[i];
      onProgress?.(i + 1, totalToUpload, `ထည့်သွင်းနေပါသည်: ${entry.title}`);
      
      try {
        await this.addEntry(entry);
        added++;
        addedTitles.push(entry.title);
        existingTitles.add(entry.title.trim().toLowerCase());
      } catch (e) {
        console.error(`Error uploading ${entry.title}:`, e);
      }
    }

    return { 
      added, 
      skipped: existingTitles.size - added, 
      addedTitles 
    };
  }
};
