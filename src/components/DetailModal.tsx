import React, { useEffect, useState } from 'react';
import { 
  X, Volume2, Bookmark, Copy, Check, BookOpen, 
  ZoomIn, ZoomOut, Type, Sparkles, BookMarked, Quote
} from 'lucide-react';
import { DictionaryEntry, ThemeMode } from '../types/dictionary';
import { AutoCrossLinkText } from './AutoCrossLinkText';
import { parseMeaningText } from '../utils/textParser';

interface DetailModalProps {
  entry: DictionaryEntry | null;
  allTitles: string[];
  onClose: () => void;
  onNavigateToTitle: (title: string) => void;
  isSaved: boolean;
  onToggleSave: () => void;
  theme?: ThemeMode;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  entry,
  allTitles,
  onClose,
  onNavigateToTitle,
  isSaved,
  onToggleSave,
  theme = 'light',
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // User Adjustable Reading Font Size (1: Small, 2: Normal, 3: Large, 4: Extra Large)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    const saved = localStorage.getItem('reading_font_size');
    return saved ? parseInt(saved, 10) : 2;
  });

  const [lineHeightRelaxed, setLineHeightRelaxed] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('reading_font_size', fontSizeLevel.toString());
  }, [fontSizeLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!entry) return null;

  // Audio Speech Synthesis
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('သင့် Browser သည် အသံထွက်စနစ်ကို မပံ့ပိုးပါ');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(entry.title);
    utterance.lang = 'my-MM';
    utterance.rate = 0.88;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy entry text
  const handleCopy = () => {
    const textToCopy = `${entry.title}\n\n${entry.meaning}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedSections = parseMeaningText(entry.meaning);

  // Font size classes
  const fontSizes = [
    'text-sm leading-relaxed',
    'text-base leading-loose',
    'text-lg leading-loose',
    'text-xl leading-[2.1]'
  ];
  const activeFontSizeClass = fontSizes[fontSizeLevel - 1] || fontSizes[1];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border transition-all animate-in fade-in zoom-in-95 duration-150 ${
          theme === 'sepia'
            ? 'bg-[#fcf6ea] text-[#2c1808] border-[#ebd7b5]'
            : theme === 'dark'
            ? 'bg-[#101726] text-[#f8fafc] border-slate-700/80 shadow-indigo-950/40'
            : 'bg-white text-slate-900 border-slate-200 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          theme === 'sepia'
            ? 'bg-[#f6ebd6] border-[#e6d0a8]'
            : theme === 'dark'
            ? 'bg-[#162033] border-slate-700/80'
            : 'bg-slate-50/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm ${
              theme === 'sepia'
                ? 'bg-amber-800 text-amber-100'
                : 'bg-indigo-600 text-white'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl sm:text-2xl font-bold truncate ${
                  theme === 'sepia'
                    ? 'text-[#5a2408]'
                    : theme === 'dark'
                    ? 'text-indigo-200'
                    : 'text-indigo-950'
                }`}>
                  {entry.title}
                </h2>
                {entry.category && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    theme === 'sepia'
                      ? 'bg-amber-200 text-amber-950 border border-amber-300'
                      : theme === 'dark'
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {entry.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reading Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Font Size Adjusters */}
            <div className={`hidden sm:flex items-center rounded-xl p-1 border ${
              theme === 'sepia'
                ? 'bg-[#ebd6b2] border-[#dcbe94]'
                : theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setFontSizeLevel(Math.max(1, fontSizeLevel - 1))}
                disabled={fontSizeLevel <= 1}
                className="p-1 px-1.5 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-black/10 transition cursor-pointer"
                title="စာလုံးအရွယ်အစား သေးမည် (A-)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel(Math.min(4, fontSizeLevel + 1))}
                disabled={fontSizeLevel >= 4}
                className="p-1 px-1.5 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-black/10 transition cursor-pointer"
                title="စာလုံးအရွယ်အစား ကြီးမည် (A+)"
              >
                A+
              </button>
            </div>

            {/* Audio Speech Button */}
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isSpeaking
                  ? 'bg-indigo-600 text-white animate-pulse border-indigo-500'
                  : theme === 'sepia'
                  ? 'bg-[#ebd6b2] text-amber-950 border-[#dcbe94] hover:bg-[#e2c89f]'
                  : theme === 'dark'
                  ? 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-750'
                  : 'bg-white text-indigo-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="အသံထွက်နားထောင်မည်"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Bookmark */}
            <button
              onClick={onToggleSave}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isSaved
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : theme === 'sepia'
                  ? 'bg-[#ebd6b2] text-amber-900 border-[#dcbe94] hover:bg-[#e2c89f]'
                  : theme === 'dark'
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={isSaved ? 'မှတ်သားထားခြင်း ဖယ်ရှားမည်' : 'မှတ်သားထားမည်'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className={`p-2 rounded-xl border transition shadow-sm cursor-pointer ${
                theme === 'sepia'
                  ? 'bg-[#ebd6b2] text-amber-900 border-[#dcbe94] hover:bg-[#e2c89f]'
                  : theme === 'dark'
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="အကြောင်းအရာ ကူးယူမည်"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer ml-1 ${
                theme === 'sepia'
                  ? 'bg-[#ebd6b2] text-amber-950 border-[#dcbe94] hover:bg-rose-100 hover:text-rose-700'
                  : theme === 'dark'
                  ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-rose-950 hover:text-rose-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600'
              }`}
              title="ပိတ်မည်"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Canvas - Optimized Contrast & Sizing */}
        <div className={`p-5 sm:p-7 overflow-y-auto space-y-6 ${activeFontSizeClass}`}>
          {/* Cover Image (if available) */}
          {entry.imageUrl && (
            <div className={`w-full h-56 sm:h-64 rounded-2xl overflow-hidden border shadow-inner ${
              theme === 'sepia'
                ? 'bg-[#f4e4c3] border-[#e6d0a3]'
                : theme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}>
              <img
                src={entry.imageUrl}
                alt={entry.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Structured Text Content with Cross-Links */}
          <div className="space-y-5">
            {parsedSections.map((sec, idx) => {
              // 1. Definition & Strong's Codes Banner
              if (sec.type === 'title_def') {
                return (
                  <div
                    key={idx}
                    className={`p-3.5 sm:p-4 rounded-2xl border font-medium ${
                      theme === 'sepia'
                        ? 'bg-[#f4e5ca] border-[#e4cca0] text-[#3d1e08]'
                        : theme === 'dark'
                        ? 'bg-[#182338] border-indigo-900/60 text-indigo-100'
                        : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <BookMarked className={`w-4 h-4 flex-shrink-0 mt-1 ${
                        theme === 'sepia' ? 'text-amber-800' : 'text-indigo-600 dark:text-indigo-400'
                      }`} />
                      <div className="flex-1">
                        <AutoCrossLinkText
                          text={sec.content}
                          allTitles={allTitles}
                          currentTitle={entry.title}
                          onNavigateToTitle={onNavigateToTitle}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. Section Headers
              if (sec.type === 'header') {
                return (
                  <div key={idx} className="pt-3">
                    <h4 className={`text-base sm:text-lg font-bold pb-1.5 mb-2 border-b flex items-center gap-2 ${
                      theme === 'sepia'
                        ? 'text-[#6b2609] border-[#e6ce9e]'
                        : theme === 'dark'
                        ? 'text-indigo-200 border-slate-700'
                        : 'text-indigo-950 border-slate-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        theme === 'sepia' ? 'bg-[#92400e]' : 'bg-indigo-600 dark:bg-indigo-400'
                      }`}></span>
                      <span>{sec.label}</span>
                    </h4>
                    {sec.content && (
                      <p className="mt-1 text-justify">
                        <AutoCrossLinkText
                          text={sec.content}
                          allTitles={allTitles}
                          currentTitle={entry.title}
                          onNavigateToTitle={onNavigateToTitle}
                        />
                      </p>
                    )}
                  </div>
                );
              }

              // 3. Bullet & Scripture References
              if (sec.type === 'bullet') {
                // If it looks like a Bible verse quotation, render as styled scripture quote card
                const isVerse = sec.content.includes('—') || sec.content.includes(':') || sec.content.includes('"');
                if (isVerse) {
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border-l-4 my-2.5 shadow-xs ${
                        theme === 'sepia'
                          ? 'bg-[#f4e5cb] border-[#b45309] text-[#2c1505]'
                          : theme === 'dark'
                          ? 'bg-[#152033] border-indigo-400 text-slate-100'
                          : 'bg-amber-50/80 border-amber-500 text-slate-900'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Quote className={`w-4 h-4 flex-shrink-0 mt-1 opacity-70 ${
                          theme === 'sepia' ? 'text-amber-800' : 'text-amber-600 dark:text-indigo-400'
                        }`} />
                        <div className="flex-1 font-normal leading-relaxed">
                          <AutoCrossLinkText
                            text={sec.content}
                            allTitles={allTitles}
                            currentTitle={entry.title}
                            onNavigateToTitle={onNavigateToTitle}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
                    <span className={`font-bold mt-1 text-sm ${
                      theme === 'sepia' ? 'text-amber-800' : 'text-indigo-600 dark:text-indigo-400'
                    }`}>•</span>
                    <div className="flex-1 leading-relaxed">
                      <AutoCrossLinkText
                        text={sec.content}
                        allTitles={allTitles}
                        currentTitle={entry.title}
                        onNavigateToTitle={onNavigateToTitle}
                      />
                    </div>
                  </div>
                );
              }

              // 4. Regular Paragraphs
              return (
                <p key={idx} className="text-justify leading-relaxed">
                  <AutoCrossLinkText
                    text={sec.content}
                    allTitles={allTitles}
                    currentTitle={entry.title}
                    onNavigateToTitle={onNavigateToTitle}
                  />
                </p>
              );
            })}
          </div>
        </div>

        {/* Footer info bar */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          theme === 'sepia'
            ? 'bg-[#f6ebd6] border-[#e6d0a8] text-[#5c381c]'
            : theme === 'dark'
            ? 'bg-[#162033] border-slate-700/80 text-slate-400'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              theme === 'sepia' ? 'bg-amber-700' : 'bg-indigo-600'
            }`}></span>
            <span>အရောင်မောင်းထားသော စကားလုံးများကို နှိပ်၍ ဆက်စပ်လေ့လာနိုင်ပါသည်။</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 font-bold rounded-xl text-xs transition shadow cursor-pointer ${
              theme === 'sepia'
                ? 'bg-amber-800 hover:bg-amber-900 text-amber-50'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            ပိတ်မည်
          </button>
        </div>
      </div>
    </div>
  );
};
