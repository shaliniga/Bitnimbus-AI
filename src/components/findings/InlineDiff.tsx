import React, { useMemo } from 'react';
import { computeWordDiff } from '../../utils/diffEngine';

interface InlineDiffProps {
  original: string;
  proposed: string;
  className?: string;
}

export const InlineDiff: React.FC<InlineDiffProps> = ({
  original,
  proposed,
  className = '',
}) => {
  const diffTokens = useMemo(() => {
    return computeWordDiff(original, proposed);
  }, [original, proposed]);

  return (
    <div
      className={`font-mono text-xs leading-relaxed p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto select-text ${className}`}
    >
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800/80 text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
          Removed
        </span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 ml-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          Proposed Replacement
        </span>
      </div>

      <div className="whitespace-pre-wrap">
        {diffTokens.map((token, index) => {
          if (token.type === 'removed') {
            return (
              <span
                key={index}
                className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 line-through decoration-rose-500 decoration-1 px-1 py-0.5 rounded mx-0.5 font-medium"
              >
                {token.value}
              </span>
            );
          }
          if (token.type === 'added') {
            return (
              <span
                key={index}
                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 underline decoration-emerald-500 decoration-2 px-1 py-0.5 rounded mx-0.5 font-semibold"
              >
                {token.value}
              </span>
            );
          }
          return <span key={index} className="text-slate-700 dark:text-slate-300">{token.value}</span>;
        })}
      </div>
    </div>
  );
};
