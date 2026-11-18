import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';

export const KeyboardDock: React.FC = () => {
  const {
    selectedFindingId,
    reviews,
    setStatus,
    applySuggestedEdit,
    nextFinding,
    prevFinding,
    toggleShortcutsModal,
    getFilteredFindings,
  } = useReviewStore();

  const filtered = getFilteredFindings();
  const currentIndex = filtered.findIndex((f) => f.id === selectedFindingId);
  const currentFinding = currentIndex !== -1 ? filtered[currentIndex] : null;

  if (!currentFinding) return null;

  const reviewState = reviews[currentFinding.id] || { status: 'pending', notes: [] };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-3 sm:px-4 py-2 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-3 sm:gap-4 text-xs select-none">
      {/* Finding Counter */}
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 pr-2 border-r border-slate-700">
        <span className="font-bold text-white">#{currentFinding.id}</span>
        <span className="text-slate-500">
          ({currentIndex + 1}/{filtered.length})
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={prevFinding}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer"
          title="Previous Finding (K or ↑)"
        >
          <ChevronLeft className="w-4 h-4" />
          <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] bg-slate-800 rounded">
            K
          </kbd>
        </button>

        <button
          type="button"
          onClick={nextFinding}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer"
          title="Next Finding (J or ↓)"
        >
          <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] bg-slate-800 rounded">
            J
          </kbd>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="hidden sm:block h-4 w-px bg-slate-700" />

      {/* Action shortcuts */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (
              currentFinding.suggestedEdit !== null &&
              !reviewState.isEditApplied
            ) {
              applySuggestedEdit(currentFinding.id);
            } else {
              setStatus(currentFinding.id, 'accepted');
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            reviewState.status === 'accepted'
              ? 'bg-emerald-500 text-white'
              : 'hover:bg-emerald-500/20 text-emerald-400'
          }`}
          title="Accept Finding (A)"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Accept</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-white/10 rounded">A</kbd>
        </button>

        <button
          type="button"
          onClick={() => setStatus(currentFinding.id, 'dismissed')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            reviewState.status === 'dismissed'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Dismiss Finding (D)"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dismiss</span>
          <kbd className="px-1 py-0.2 text-[9px] bg-white/10 rounded">D</kbd>
        </button>
      </div>

      <div className="hidden md:block h-4 w-px bg-slate-700" />

      {/* Help Modal trigger */}
      <button
        type="button"
        onClick={() => toggleShortcutsModal(true)}
        className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title="View All Shortcuts (?)"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
};
