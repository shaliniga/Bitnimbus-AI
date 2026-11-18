import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';

export const KeyboardShortcutsModal: React.FC = () => {
  const { showShortcutsModal, toggleShortcutsModal } = useReviewStore();

  if (!showShortcutsModal) return null;

  const shortcuts = [
    { key: 'J / ↓', label: 'Next Finding', desc: 'Advance focus to next finding' },
    { key: 'K / ↑', label: 'Previous Finding', desc: 'Move focus to previous finding' },
    { key: 'A', label: 'Accept & Apply', desc: 'Accept finding / apply proposed edit' },
    { key: 'D', label: 'Dismiss', desc: 'Dismiss finding as acceptable risk' },
    { key: 'Z', label: 'Toggle Zen Mode', desc: 'Switch to distraction-free Speed Review' },
    { key: '?', label: 'Shortcuts Help', desc: 'Open this keyboard reference cheatsheet' },
    { key: 'Esc', label: 'Close / Cancel', desc: 'Close active modal or Zen mode' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-500">Speed up your legal review pass</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleShortcutsModal(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none"
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {sc.label}
                </span>
                <span className="text-[11px] text-slate-400">{sc.desc}</span>
              </div>
              <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => toggleShortcutsModal(false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
