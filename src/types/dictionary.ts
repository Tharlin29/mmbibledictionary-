export interface DictionaryEntry {
  id?: string;
  title: string;
  imageUrl?: string;
  meaning: string;
  category?: string;
  updatedAt?: number;
}

export type ThemeMode = 'light' | 'dark' | 'sepia';

export type CategoryFilter = 
  | 'all'
  | 'လူပုဂ္ဂိုလ်များ'
  | 'နေရာဒေသများ'
  | 'ဝေါဟာရနှင့် သမ္မာတရားများ'
  | 'ဝတ်ပြုကိုးကွယ်မှု'
  | 'ပွဲတော်နှင့် အခမ်းအနား';
