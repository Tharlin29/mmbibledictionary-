import { DictionaryEntry } from '../types/dictionary';

export const aiService = {
  /**
   * Request Gemini AI to generate a single scholarly Myanmar Bible dictionary entry
   */
  async generateEntry(keyword: string): Promise<DictionaryEntry> {
    const res = await fetch('/api/ai/generate-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'AI မှ အဘိဓာန် အချက်အလက် ရှာဖွေရေးသားရန် မအောင်မြင်ပါ');
    }

    return await res.json();
  },

  /**
   * Request Gemini AI to generate a batch of unadded Bible words
   */
  async generateBatch(count: number, existingTitles: string[]): Promise<DictionaryEntry[]> {
    const res = await fetch('/api/ai/batch-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, existingTitles })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'AI မှ စကားလုံးအသစ်များ ထုတ်လုပ်ရန် မအောင်မြင်ပါ');
    }

    return await res.json();
  }
};
