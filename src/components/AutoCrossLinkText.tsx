import React from 'react';

interface AutoCrossLinkTextProps {
  text: string;
  allTitles: string[];
  currentTitle: string;
  onNavigateToTitle: (title: string) => void;
  className?: string;
}

export const AutoCrossLinkText: React.FC<AutoCrossLinkTextProps> = ({
  text,
  allTitles,
  currentTitle,
  onNavigateToTitle,
  className = ''
}) => {
  if (!text) return null;

  // Filter out current title and short empty strings
  const targetTitles = allTitles
    .filter(t => t && t.trim() !== '' && t.trim().toLowerCase() !== currentTitle.trim().toLowerCase())
    .sort((a, b) => b.length - a.length);

  if (targetTitles.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Escape for regex
  const escapedTitles = targetTitles.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTitles.join('|')})`, 'g');

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatched = targetTitles.includes(part);
        if (isMatched) {
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToTitle(part);
              }}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs sm:text-sm font-semibold rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-900 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/70 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/50 transition cursor-pointer underline underline-offset-2"
              title={`"${part}" အဓိပ္ပာယ်သို့ တိုက်ရိုက်သွားရန်`}
            >
              {part}
            </button>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
