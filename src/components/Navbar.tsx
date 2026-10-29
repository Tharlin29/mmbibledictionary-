import React from 'react';
import { BookOpen, Sun, Moon, Coffee, ShieldCheck, ShieldAlert, Bookmark, CloudCheck, WifiOff } from 'lucide-react';
import { ThemeMode } from '../types/dictionary';

interface NavbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  savedCount: number;
  showOnlySaved: boolean;
  onToggleSavedOnly: () => void;
  isOnline: boolean;
  onHomeClick: () => void;
  totalEntries: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onThemeChange,
  isAdmin,
  onToggleAdmin,
  savedCount,
  showOnlySaved,
  onToggleSavedOnly,
  isOnline,
  onHomeClick,
  totalEntries,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white shadow-xl border-b border-indigo-700/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-wide text-white group-hover:text-amber-300 transition-colors">
                မြန်မာ သမ္မာကျမ်းစာ အဘိဓာန်
              </h1>
              <span className="hidden md:inline-flex text-[11px] bg-indigo-700/70 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium text-indigo-100">
                {totalEntries} ပုဒ်
              </span>
            </div>
            <p className="text-[11px] text-indigo-200 hidden sm:block">
              Myanmar Bible Dictionary & Theological Lexicon
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Sync Status */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-200">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Realtime Cloud</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">Offline</span>
              </>
            )}
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={onToggleSavedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showOnlySaved
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-indigo-950/60 hover:bg-indigo-900 text-indigo-100 border-indigo-500/30'
            }`}
            title="မှတ်သားထားသော စကားလုံးများ ကြည့်မည်"
          >
            <Bookmark className={`w-3.5 h-3.5 ${showOnlySaved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">သိမ်းထားသည်</span>
            {savedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                showOnlySaved ? 'bg-slate-950 text-amber-300' : 'bg-amber-400 text-slate-950'
              }`}>
                {savedCount}
              </span>
            )}
          </button>

          {/* Theme Mode Switcher */}
          <div className="flex items-center bg-indigo-950/80 p-1 rounded-xl border border-indigo-500/30">
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded-lg transition ${
                theme === 'light' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="နေ့ခင်းမုဒ် (Light Mode)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            </button>
            <button
              onClick={() => onThemeChange('sepia')}
              className={`p-1.5 rounded-lg transition ${
                theme === 'sepia' ? 'bg-amber-700 text-amber-100 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="စာအုပ်ဖတ်မုဒ် (Sepia Parchment Mode)"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-200" />
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded-lg transition ${
                theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="ညမုဒ် (Dark Mode)"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
            </button>
          </div>

          {/* Admin Login / Dashboard Button */}
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition shadow-sm ${
              isAdmin
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                : 'bg-indigo-950/60 hover:bg-indigo-900 text-indigo-100 border-indigo-500/30'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Admin Panel</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
