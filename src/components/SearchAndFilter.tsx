import React from 'react';
import { Search, X, Sparkles, Filter, Layers, RefreshCw, Wand2, PlusCircle } from 'lucide-react';
import { CategoryFilter, ThemeMode } from '../types/dictionary';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryFilter;
  onCategorySelect: (cat: CategoryFilter) => void;
  selectedLetter: string;
  onLetterSelect: (letter: string) => void;
  onRandomWord: () => void;
  matchCount: number;
  totalCount: number;
  theme?: ThemeMode;
  onGenerateWithAI?: (query: string) => Promise<void>;
  isGeneratingAI?: boolean;
}

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'အားလုံး (All)', icon: '📖' },
  { id: 'လူပုဂ္ဂိုလ်များ', label: 'လူပုဂ္ဂိုလ်များ (People)', icon: '👤' },
  { id: 'နေရာဒေသများ', label: 'နေရာဒေသများ (Places)', icon: '🏛️' },
  { id: 'ဝေါဟာရနှင့် သမ္မာတရားများ', label: 'ဝေါဟာရနှင့် သမ္မာတရား (Theology)', icon: '🕊️' },
  { id: 'ဝတ်ပြုကိုးကွယ်မှု', label: 'ဝတ်ပြုကိုးကွယ်မှု (Worship)', icon: '🕯️' },
  { id: 'ပွဲတော်နှင့် အခမ်းအနား', label: 'ပွဲတော်များ (Feasts)', icon: '🌾' },
];

const MYANMAR_CONSONANTS = [
  'က', 'ခ', 'ဂ', 'စ', 'ဆ', 'ဇ', 'ည', 'တ', 'ထ', 'ဒ', 
  'န', 'ပ', 'ဖ', 'ဗ', 'မ', 'ယ', 'ရ', 'လ', 'ဝ', 'သ', 'ဟ', 'အ'
];

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  selectedLetter,
  onLetterSelect,
  onRandomWord,
  matchCount,
  totalCount,
  theme = 'light',
  onGenerateWithAI,
  isGeneratingAI = false,
}) => {
  const hasQuery = searchQuery.trim().length > 0;
  const isNoMatch = hasQuery && matchCount === 0;

  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className={`p-4 sm:p-6 rounded-3xl shadow-sm border transition-colors ${
        theme === 'sepia'
          ? 'bg-[#f7eedb] border-[#ebd7b5]'
          : theme === 'dark'
          ? 'bg-[#131b2a] border-[#243046]'
          : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <label htmlFor="bibleSearch" className={`text-sm font-bold flex items-center gap-2 ${
            theme === 'sepia' ? 'text-[#361c07]' : 'text-slate-800 dark:text-slate-100'
          }`}>
            <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>ရှာဖွေလိုသော စကားလုံး၊ လူအမည် သို့မဟုတ် သမ္မာကျမ်းစာ ဝေါဟာရ</span>
          </label>

          <button
            type="button"
            onClick={onRandomWord}
            className={`self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
              theme === 'sepia'
                ? 'bg-[#ebd5b0] text-[#3d1e08] border-[#dcbe94] hover:bg-[#e4cb9e]'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>ကျပန်း စကားလုံးလေ့လာရန်</span>
          </button>
        </div>

        <div className="relative">
          <input
            id="bibleSearch"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ဥပမာ - ဗက်သလီဟင်၊ ဒါဝဒ်၊ ယေရှု၊ မေလခိဇေဒက်၊ ဧသတာ..."
            className={`w-full pl-12 pr-11 py-3.5 rounded-2xl text-sm sm:text-base border outline-none transition shadow-inner font-medium ${
              theme === 'sepia'
                ? 'bg-[#fcf7ee] border-[#e2cca4] text-[#2c1705] placeholder-[#94765d] focus:ring-2 focus:ring-amber-700'
                : theme === 'dark'
                ? 'bg-[#0b0f17] border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* AI AUTO-SEARCH & ADD BANNER (When searching a term) */}
        {hasQuery && onGenerateWithAI && (
          <div className={`mt-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isNoMatch
              ? theme === 'sepia'
                ? 'bg-[#f4e2c2] border-[#deb984]'
                : 'bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-950/60 dark:to-slate-800 border-indigo-200 dark:border-indigo-800'
              : theme === 'sepia'
              ? 'bg-[#f5e7ce] border-[#e4cca0]'
              : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0 text-white ${
                theme === 'sepia' ? 'bg-amber-800' : 'bg-indigo-600'
              }`}>
                <Wand2 className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <p className={`font-bold ${
                  theme === 'sepia' ? 'text-[#381a05]' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {isNoMatch ? `"${searchQuery}" ကို Database တွင် မတွေ့ရှိသေးပါ` : `"${searchQuery}" အတွက် AI ဖြင့် အချက်အလက်သစ် ရှာဖွေနိုင်ပါသည်`}
                </p>
                <p className={`text-xs mt-0.5 ${
                  theme === 'sepia' ? 'text-[#6c401f]' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  AI မှ မူရင်းဟေဗြဲ/ဂရိ Strong's နံပါတ်နှင့် သမ္မာကျမ်းစာ အဓိပ္ပာယ်ကို ရေးသားကာ Database ထဲသို့ အလိုအလျောက် Add ပေးပါမည်။
                </p>
              </div>
            </div>

            <button
              onClick={() => onGenerateWithAI(searchQuery)}
              disabled={isGeneratingAI}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex-shrink-0 cursor-pointer ${
                theme === 'sepia'
                  ? 'bg-amber-800 hover:bg-amber-900 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-60`}
            >
              {isGeneratingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI ရှာဖွေပြီး Add နေပါသည်...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI ဖြင့် ရှာဖွေ၍ Database ထဲသို့ Add မည်</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Consonant Letter Chips */}
        <div className={`mt-3.5 pt-3 border-t ${
          theme === 'sepia' ? 'border-[#ebd7b5]' : 'border-slate-100 dark:border-slate-700/60'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className={`text-[11px] font-bold flex-shrink-0 mr-1 ${
              theme === 'sepia' ? 'text-amber-900/60' : 'text-slate-400 dark:text-slate-500'
            }`}>
              အက္ခရာစဉ်:
            </span>
            <button
              onClick={() => onLetterSelect('')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 transition cursor-pointer ${
                selectedLetter === ''
                  ? theme === 'sepia'
                    ? 'bg-amber-800 text-white'
                    : 'bg-indigo-600 text-white'
                  : theme === 'sepia'
                  ? 'bg-[#eddcb9] text-[#3c1e08] hover:bg-[#e4ceaa]'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              အားလုံး
            </button>
            {MYANMAR_CONSONANTS.map((letter) => (
              <button
                key={letter}
                onClick={() => onLetterSelect(selectedLetter === letter ? '' : letter)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
                  selectedLetter === letter
                    ? theme === 'sepia'
                      ? 'bg-amber-800 text-white shadow-sm ring-2 ring-amber-500'
                      : 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-500'
                    : theme === 'sepia'
                    ? 'bg-[#eddcb9] text-[#3c1e08] hover:bg-[#e4ceaa]'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? theme === 'sepia'
                    ? 'bg-amber-800 text-white shadow-md'
                    : 'bg-indigo-600 text-white shadow-md'
                  : theme === 'sepia'
                  ? 'bg-[#f7eedb] text-[#3c1e08] hover:bg-[#f0dfc2] border border-[#ebd7b5]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Result Summary info */}
      {(searchQuery || selectedLetter || selectedCategory !== 'all') && (
        <div className={`flex items-center justify-between px-2 text-xs ${
          theme === 'sepia' ? 'text-[#6c401f]' : 'text-slate-500 dark:text-slate-400'
        }`}>
          <span>
            ရှာဖွေတွေ့ရှိချက်: <strong className={`font-bold ${
              theme === 'sepia' ? 'text-amber-800' : 'text-indigo-600 dark:text-indigo-400'
            }`}>{matchCount}</strong> ခု (စုစုပေါင်း {totalCount} ပုဒ်အနက်)
          </span>
          <button
            onClick={() => {
              onSearchChange('');
              onLetterSelect('');
              onCategorySelect('all');
            }}
            className={`text-xs hover:underline font-bold cursor-pointer ${
              theme === 'sepia' ? 'text-amber-800' : 'text-indigo-600 dark:text-indigo-400'
            }`}
          >
            Filter အားလုံးရှင်းမည်
          </button>
        </div>
      )}
    </div>
  );
};
