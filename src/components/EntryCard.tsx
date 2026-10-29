import React from 'react';
import { BookOpen, Bookmark, ChevronRight } from 'lucide-react';
import { DictionaryEntry, ThemeMode } from '../types/dictionary';

interface EntryCardProps {
  entry: DictionaryEntry;
  onClick: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  theme?: ThemeMode;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onClick,
  isSaved,
  onToggleSave,
  theme = 'light',
}) => {
  // Extract a brief clean preview line from meaning
  const getPreview = (meaning: string) => {
    if (!meaning) return '';
    const lines = meaning.split('\n');
    for (const l of lines) {
      const clean = l.replace(/^[\*\-\s]+/, '').trim();
      if (clean && !clean.startsWith('မူရင်း') && !clean.startsWith('ဟေဗြဲ') && !clean.startsWith('ဂရိ')) {
        return clean.replace(/^[အဓိပ္ပာယ်ရှင်းလင်းချက်:]+/, '').trim();
      }
    }
    return lines[0] || '';
  };

  const preview = getPreview(entry.meaning);

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
        theme === 'sepia'
          ? 'bg-[#f7eedb] border-[#ebd7b5] hover:border-amber-600/60 hover:shadow-md'
          : theme === 'dark'
          ? 'bg-[#131b2a] border-[#243046] hover:border-indigo-500/60 hover:shadow-md'
          : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Thumbnail / Icon */}
          {entry.imageUrl ? (
            <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border ${
              theme === 'sepia'
                ? 'bg-[#eddcb9] border-[#e2cca4]'
                : theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-100 border-slate-200'
            }`}>
              <img
                src={entry.imageUrl}
                alt={entry.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
              theme === 'sepia'
                ? 'bg-[#ebd5b0] text-amber-900 group-hover:bg-amber-800 group-hover:text-amber-100'
                : theme === 'dark'
                ? 'bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
          )}

          {/* Title & Preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-bold transition-colors truncate ${
                theme === 'sepia'
                  ? 'text-[#2a1505] group-hover:text-amber-800'
                  : theme === 'dark'
                  ? 'text-[#f1f5f9] group-hover:text-indigo-300'
                  : 'text-slate-900 group-hover:text-indigo-600'
              }`}>
                {entry.title}
              </h3>
              {entry.category && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  theme === 'sepia'
                    ? 'bg-[#ebd5af] text-[#4d240b]'
                    : theme === 'dark'
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {entry.category}
                </span>
              )}
            </div>
            {preview && (
              <p className={`mt-1.5 text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                theme === 'sepia'
                  ? 'text-[#5a361a]'
                  : theme === 'dark'
                  ? 'text-[#94a3b8]'
                  : 'text-slate-600'
              }`}>
                {preview}
              </p>
            )}
          </div>
        </div>

        {/* Bookmark & Arrow */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onToggleSave}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isSaved
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : theme === 'sepia'
                ? 'text-amber-900/50 hover:text-amber-800 hover:bg-[#ebd5af]'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isSaved ? 'မှတ်သားထားခြင်း ဖယ်ရှားမည်' : 'မှတ်သားထားမည်'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
            theme === 'sepia'
              ? 'text-amber-900/40 group-hover:text-amber-800'
              : theme === 'dark'
              ? 'text-slate-600 group-hover:text-indigo-300'
              : 'text-slate-300 group-hover:text-indigo-600'
          }`} />
        </div>
      </div>
    </div>
  );
};
