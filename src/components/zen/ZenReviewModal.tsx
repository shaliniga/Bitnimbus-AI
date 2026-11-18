import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  GitCompare,
  MessageSquare,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { InlineDiff } from '../findings/InlineDiff';

export const ZenReviewModal: React.FC = () => {
  const {
    contract,
    selectedFindingId,
    reviews,
    setStatus,
    applySuggestedEdit,
    nextFinding,
    prevFinding,
    setZenMode,
    addNote,
    getFilteredFindings,
  } = useReviewStore();

  const [noteText, setNoteText] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const filtered = getFilteredFindings();
  const currentIndex = filtered.findIndex((f) => f.id === selectedFindingId);
  const currentFinding = currentIndex !== -1 ? filtered[currentIndex] : filtered[0];

  if (!currentFinding) return null;

  const reviewState = reviews[currentFinding.id] || { status: 'pending', notes: [] };
  const isAccepted = reviewState.status === 'accepted';
  const isDismissed = reviewState.status === 'dismissed';

  // Find anchored paragraph text for context
  let paragraphText = '';
  if (currentFinding.anchor) {
    for (const sec of contract.sections) {
      const p = sec.paragraphs.find((para) => para.id === currentFinding.anchor?.paragraphId);
      if (p) {
        paragraphText = p.text;
        break;
      }
    }
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote(currentFinding.id, noteText.trim());
    setNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col text-slate-100">
      {/* Zen Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-wide text-indigo-400 uppercase">
            ⚡ Speed Review Mode
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Finding {currentIndex + 1} of {filtered.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="hidden sm:block w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-200"
            style={{ width: `${((currentIndex + 1) / filtered.length) * 100}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => setZenMode(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
        >
          <span>Exit (Esc)</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content: Split Context & Finding */}
      <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Document Paragraph Context */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-semibold text-slate-400">
              {currentFinding.anchor
                ? `Contract Clause § ${currentFinding.anchor.paragraphId.replace('p-', '')}`
                : 'Systemic / Document-Wide Issue'}
            </span>
            <span className="text-xs text-slate-500 font-medium">Contextual View</span>
          </div>

          {currentFinding.anchor ? (
            <div className="space-y-4">
              <p className="font-serif text-base sm:text-lg leading-relaxed text-slate-300">
                {paragraphText.slice(0, currentFinding.anchor.start)}
                <mark className="bg-amber-400/30 text-amber-200 px-1 py-0.5 rounded border-b-2 border-amber-400 font-medium">
                  {currentFinding.anchor.quote}
                </mark>
                {paragraphText.slice(currentFinding.anchor.end)}
              </p>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">
                  Referenced text span:
                </span>
                <p className="italic text-slate-300 font-serif">
                  "{currentFinding.anchor.quote}"
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-200 text-sm mb-1">
                Document-Wide Finding (Missing Clause)
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                This issue represents a missing provision that is not present in the contract text.
              </p>
            </div>
          )}
        </div>

        {/* Right: Finding Details & Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
          {/* Top Metadata */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded">
                #{currentFinding.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  currentFinding.severity === 'high'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : currentFinding.severity === 'medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {currentFinding.severity} Risk
              </span>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {currentFinding.category}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{Math.round(currentFinding.confidence * 100)}% Confidence</span>
            </div>
          </div>

          {/* Title & Explanation */}
          <div>
            <h2 className="text-lg font-bold text-white mb-2 leading-snug">
              {currentFinding.title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              {currentFinding.explanation}
            </p>
          </div>

          {/* Redline Diff if suggested edit exists */}
          {currentFinding.suggestedEdit && currentFinding.anchor && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Proposed Redline Edit</span>
              </div>
              <InlineDiff
                original={currentFinding.anchor.quote}
                proposed={currentFinding.suggestedEdit}
              />
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (currentFinding.suggestedEdit) {
                  applySuggestedEdit(currentFinding.id);
                } else {
                  setStatus(currentFinding.id, 'accepted');
                }
                nextFinding();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAccepted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {currentFinding.suggestedEdit ? 'Accept & Apply Amendment' : 'Accept Finding'}
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded">A</kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus(currentFinding.id, 'dismissed');
                nextFinding();
              }}
              className={`py-3 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDismissed
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Dismiss</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded">D</kbd>
            </button>

            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Notes ({reviewState.notes.length})</span>
            </button>
          </div>

          {/* Notes Accordion */}
          {showNotes && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add note for this finding..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save
                </button>
              </form>

              {reviewState.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <p className="text-slate-300">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zen Bottom Controls */}
      <div className="h-16 px-6 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
        <button
          type="button"
          onClick={prevFinding}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous (K)</span>
        </button>

        <span className="text-xs text-slate-500 hidden sm:inline">
          Use keyboard shortcuts [A] Accept, [D] Dismiss, [J/K] Navigate
        </span>

        <button
          type="button"
          onClick={nextFinding}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <span>Next (J)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
