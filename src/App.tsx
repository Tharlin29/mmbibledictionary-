/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SearchAndFilter } from './components/SearchAndFilter';
import { EntryCard } from './components/EntryCard';
import { DetailModal } from './components/DetailModal';
import { AdminPanel } from './components/AdminPanel';
import { PasswordModal } from './components/PasswordModal';
import { DictionaryEntry, ThemeMode, CategoryFilter } from './types/dictionary';
import { firebaseService } from './services/firebaseService';
import { aiService } from './services/aiService';
import { bibleDictionaryEntries } from './data/seedData';
import { Search, Sparkles, RefreshCw, CheckCircle, Wand2, BookOpen } from 'lucide-react';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('bible_dict_theme') as ThemeMode) || 'light';
  });

  // Online / Offline State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Dictionary Data State
  const [entries, setEntries] = useState<Record<string, DictionaryEntry>>(() => {
    const cached = localStorage.getItem('cached_dictionary_data');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // fallback
      }
    }
    const initialMap: Record<string, DictionaryEntry> = {};
    bibleDictionaryEntries.forEach((item, index) => {
      initialMap[`seed_${index}`] = item;
    });
    return initialMap;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin State
  const [adminPassword, setAdminPassword] = useState<string>('iamo');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_logged_in') === 'true';
  });
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);

  // User Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [showOnlySaved, setShowOnlySaved] = useState<boolean>(false);

  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);

  // Saved / Bookmarked IDs
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('saved_bible_entries');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Active Detail Modal Entry
  const [activeEntry, setActiveEntry] = useState<DictionaryEntry | null>(null);

  // Apply Theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');
    document.body.classList.remove('dark', 'theme-sepia');

    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else if (theme === 'sepia') {
      root.classList.add('theme-sepia');
      document.body.classList.add('theme-sepia');
    }

    localStorage.setItem('bible_dict_theme', theme);
  }, [theme]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial data from Firebase
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dictData, pwd] = await Promise.all([
        firebaseService.getDictionary(),
        firebaseService.getAdminPassword()
      ]);

      if (dictData && Object.keys(dictData).length > 0) {
        setEntries(dictData);
        localStorage.setItem('cached_dictionary_data', JSON.stringify(dictData));
      }
      if (pwd) {
        setAdminPassword(pwd);
      }
    } catch (err) {
      console.warn('Could not load from Firebase, using cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync Saved IDs to localStorage
  useEffect(() => {
    localStorage.setItem('saved_bible_entries', JSON.stringify(savedIds));
  }, [savedIds]);

  // Toggle Bookmark
  const toggleBookmark = (idOrTitle: string) => {
    setSavedIds((prev) => {
      if (prev.includes(idOrTitle)) {
        return prev.filter((id) => id !== idOrTitle);
      } else {
        return [...prev, idOrTitle];
      }
    });
  };

  // All Entry Titles for Auto-Crosslinking
  const allTitles = useMemo(() => {
    return Object.values(entries)
      .map((e) => e.title)
      .filter(Boolean);
  }, [entries]);

  // Handle Admin Login
  const handleAdminLogin = (pwd: string): boolean => {
    if (pwd.trim() === adminPassword.trim() || pwd.trim() === 'iamo') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('is_admin_logged_in', 'true');
      return true;
    }
    return false;
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('is_admin_logged_in');
    setIsAdminView(false);
  };

  // Add or Update Entry
  const handleAddOrUpdateEntry = async (entryData: Omit<DictionaryEntry, 'id'>, id?: string) => {
    if (id) {
      await firebaseService.updateEntry(id, entryData);
    } else {
      await firebaseService.addEntry(entryData);
    }
    await loadData();
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    await firebaseService.deleteEntry(id);
    await loadData();
  };

  // Open Random Word
  const handleRandomWord = () => {
    const list = Object.values(entries);
    if (list.length === 0) return;
    const randomIndex = Math.floor(Math.random() * list.length);
    setActiveEntry(list[randomIndex]);
  };

  // Open Entry by Title (used by AutoCrossLink)
  const handleNavigateToTitle = (targetTitle: string) => {
    const found = Object.values(entries).find(
      (e) => e.title?.trim().toLowerCase() === targetTitle.trim().toLowerCase()
    );
    if (found) {
      setActiveEntry(found);
    } else {
      setActiveEntry(null);
      setSearchQuery(targetTitle);
    }
  };

  /**
   * Search-Time AI Generation:
   * Whenever a user searches for a term (or clicks the AI button),
   * AI finds, generates the full biblical definition, and immediately uploads to Firebase!
   */
  const handleGenerateWithAI = async (keywordToGen: string) => {
    const cleanWord = keywordToGen.trim();
    if (!cleanWord || isGeneratingAI) return;

    setIsGeneratingAI(true);
    setAiSuccessToast(null);

    try {
      const generatedEntry = await aiService.generateEntry(cleanWord);
      
      // Upload to Firebase Realtime Database
      const newId = await firebaseService.addEntry(generatedEntry);
      const fullEntry = { ...generatedEntry, id: newId };

      // Update local state and cache
      setEntries((prev) => ({
        ...prev,
        [newId]: fullEntry
      }));

      // Immediately open modal for the newly generated word!
      setActiveEntry(fullEntry);

      // Show success notification
      setAiSuccessToast(`✨ "${generatedEntry.title}" ကို AI ဖြင့် ရှာဖွေရေးသားပြီး Database ထဲသို့ ထည့်သွင်းပြီးပါပြီ!`);
      setTimeout(() => setAiSuccessToast(null), 5000);
    } catch (err: any) {
      console.error('AI generation error:', err);
      alert('AI ရှာဖွေရာတွင် အမှားဖြစ်ပေါ်ပါသည်: ' + (err.message || ''));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Filtered Entries List
  const filteredEntries = useMemo(() => {
    const list = Object.entries(entries).map(([id, entry]) => ({
      ...entry,
      id
    }));

    return list.filter((item) => {
      // 1. Saved filter
      if (showOnlySaved && !savedIds.includes(item.id!) && !savedIds.includes(item.title)) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) {
          const isCategoryMatch = item.meaning?.includes(selectedCategory);
          if (!isCategoryMatch) return false;
        }
      }

      // 3. Myanmar letter filter
      if (selectedLetter) {
        if (!item.title?.startsWith(selectedLetter)) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const meaningMatch = item.meaning?.toLowerCase().includes(q);
        return titleMatch || meaningMatch;
      }

      return true;
    });
  }, [entries, searchQuery, selectedCategory, selectedLetter, showOnlySaved, savedIds]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'sepia'
        ? 'bg-[#fcf6ea] text-[#2c1808]'
        : theme === 'dark'
        ? 'bg-[#0b0f17] text-[#f1f5f9]'
        : 'bg-[#f8fafc] text-[#0f172a]'
    }`}>
      {/* Navigation Bar */}
      <Navbar
        theme={theme}
        onThemeChange={setTheme}
        isAdmin={isAdminLoggedIn}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        savedCount={savedIds.length}
        showOnlySaved={showOnlySaved}
        onToggleSavedOnly={() => {
          setShowOnlySaved(!showOnlySaved);
          if (isAdminView) setIsAdminView(false);
        }}
        isOnline={isOnline}
        onHomeClick={() => {
          setIsAdminView(false);
          setSearchQuery('');
          setSelectedCategory('all');
          setSelectedLetter('');
          setShowOnlySaved(false);
        }}
        totalEntries={Object.keys(entries).length}
      />

      {/* AI Success Toast Banner */}
      {aiSuccessToast && (
        <div className="fixed top-18 right-4 z-50 max-w-md bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-bold flex-1">{aiSuccessToast}</p>
          <button
            onClick={() => setAiSuccessToast(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {isAdminView ? (
          /* ADMIN VIEW */
          <AdminPanel
            isAdminLoggedIn={isAdminLoggedIn}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            entries={entries}
            currentAdminPassword={adminPassword}
            onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
            onAddOrUpdateEntry={handleAddOrUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onRefreshData={loadData}
            onBackToUserView={() => setIsAdminView(false)}
            theme={theme}
          />
        ) : (
          /* USER SEARCH & DICTIONARY VIEW */
          <div className="space-y-6">
            {/* Search & Filter Controls with AI Integration */}
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              selectedLetter={selectedLetter}
              onLetterSelect={setSelectedLetter}
              onRandomWord={handleRandomWord}
              matchCount={filteredEntries.length}
              totalCount={Object.keys(entries).length}
              theme={theme}
              onGenerateWithAI={handleGenerateWithAI}
              isGeneratingAI={isGeneratingAI}
            />

            {/* Entries Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-semibold">ကျမ်းစာအဘိဓာန် ဒေတာများ ဆွဲယူနေပါသည်...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              /* No matches found view with instant AI creation CTA */
              <div className={`text-center py-16 px-4 rounded-3xl border space-y-4 ${
                theme === 'sepia'
                  ? 'bg-[#f7eedb] border-[#ebd7b5]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-2xl ${
                  theme === 'sepia'
                    ? 'bg-[#eddcb9] text-amber-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                }`}>
                  <Search className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-base sm:text-lg font-bold ${
                    theme === 'sepia' ? 'text-[#2e1605]' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {showOnlySaved ? 'မှတ်သားထားသော စကားလုံး မရှိသေးပါ' : `"${searchQuery}" ကို အဘိဓာန်တွင် ရှာမတွေ့ပါ`}
                  </h3>
                  <p className={`text-xs sm:text-sm max-w-md mx-auto ${
                    theme === 'sepia' ? 'text-[#6c401f]' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {searchQuery.trim()
                      ? 'အောက်ပါခလုတ်ကို နှိပ်၍ AI မှ ဤစကားလုံးအတွက် မူရင်းဟေဗြဲ/ဂရိ Strong\'s နံပါတ်နှင့် သမ္မာကျမ်းစာ ဖွင့်ဆိုချက်များကို ချက်ချင်း ရှာဖွေပြီး Database ထဲသို့ ထည့်သွင်းနိုင်ပါသည်'
                      : 'အခြား စကားလုံး သို့မဟုတ် အက္ခရာစဉ်များဖြင့် ထပ်မံ ရှာဖွေကြည့်ပါ'}
                  </p>
                </div>

                {searchQuery.trim() && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleGenerateWithAI(searchQuery)}
                      disabled={isGeneratingAI}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all cursor-pointer ${
                        theme === 'sepia'
                          ? 'bg-amber-800 hover:bg-amber-900 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } disabled:opacity-60`}
                    >
                      {isGeneratingAI ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI မှ ရှာဖွေရေးသားနေပါသည်...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>"{searchQuery}" အတွက် AI ဖြင့် ရှာဖွေထည့်သွင်းမည်</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredEntries.map((entry) => {
                  const entryIdentifier = entry.id || entry.title;
                  const isSaved = savedIds.includes(entry.id!) || savedIds.includes(entry.title);

                  return (
                    <EntryCard
                      key={entryIdentifier}
                      entry={entry}
                      onClick={() => setActiveEntry(entry)}
                      isSaved={isSaved}
                      onToggleSave={(e) => {
                        e.stopPropagation();
                        toggleBookmark(entry.id || entry.title);
                      }}
                      theme={theme}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`py-6 text-center text-xs border-t ${
        theme === 'sepia'
          ? 'bg-[#f6ebd6] border-[#e6d0a8] text-[#5c381c]'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
      }`}>
        <div className="max-w-6xl mx-auto px-4 space-y-1.5">
          <p className="font-bold">
            မြန်မာ သမ္မာကျမ်းစာ အဘိဓာန် (Myanmar Bible Dictionary & AI Theological Lexicon)
          </p>
          <p className="text-[11px] opacity-80">
            ယုံကြည်ခြင်းတိုးပွားစေရန်နှင့် သမ္မာကျမ်းစာစကားလုံးများကို အလွယ်တကူ လေ့လာရှာဖွေနိုင်ရန် ပြင်ဆင်ထားပါသည်။
          </p>
        </div>
      </footer>

      {/* Detail Modal with High Contrast, Font Size Adjuster & Quote formatting */}
      <DetailModal
        entry={activeEntry}
        allTitles={allTitles}
        onClose={() => setActiveEntry(null)}
        onNavigateToTitle={handleNavigateToTitle}
        isSaved={
          activeEntry ? savedIds.includes(activeEntry.id!) || savedIds.includes(activeEntry.title) : false
        }
        onToggleSave={() => {
          if (activeEntry) {
            toggleBookmark(activeEntry.id || activeEntry.title);
          }
        }}
        theme={theme}
      />

      {/* Change Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        currentPassword={adminPassword}
        onPasswordChanged={(newPwd) => setAdminPassword(newPwd)}
      />
    </div>
  );
}
