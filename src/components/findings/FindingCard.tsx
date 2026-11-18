import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trash2,
  Send,
  Eye,
  GitCompare,
} from 'lucide-react';
import type { Finding, FindingSeverity } from '../../types/finding';
import { useReviewStore } from '../../store/useReviewStore';
import { InlineDiff } from './InlineDiff';

interface FindingCardProps {
  finding: Finding;
  isSelected: boolean;
}

const QUICK_NOTES = [
  'Flag for external counsel',
  'Counter-propose 12-mo cap',
  'Non-negotiable warranty',
  'Check SOW alignment',
  'Requires CFO sign-off',
];

export const FindingCard: React.FC<FindingCardProps> = ({ finding, isSelected }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showDiff, setShowDiff] = useState(true);

  const {
    reviews,
    setStatus,
    addNote,
    deleteNote,
    applySuggestedEdit,
    revertSuggestedEdit,
    selectFinding,
  } = useReviewStore();

  const reviewState = reviews[finding.id] || { status: 'pending', notes: [] };
  const isAccepted = reviewState.status === 'accepted';
  const isDismissed = reviewState.status === 'dismissed';
  const isApplied = reviewState.isEditApplied;

  // Auto-scroll into view when selected via document interaction
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isSelected]);

  const handleSelect = () => {
    selectFinding(finding.id, finding.anchor?.paragraphId || null);
  };

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteText.trim()) return;
    addNote(finding.id, noteText.trim());
    setNoteText('');
  };

  const handleQuickNote = (preset: string) => {
    addNote(finding.id, preset);
  };

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 shadow-xs">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            HIGH RISK
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shadow-xs">
            <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            LOW RISK
          </span>
        );
    }
  };

  const confidencePercent = Math.round(finding.confidence * 100);

  return (
    <div
      ref={cardRef}
      id={`finding-${finding.id}`}
      onClick={handleSelect}
      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20 dark:ring-indigo-500/30'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
      } ${
        isAccepted
          ? 'border-l-4 border-l-emerald-500'
          : isDismissed
          ? 'opacity-65 border-l-4 border-l-slate-400'
          : finding.severity === 'high'
          ? 'border-l-4 border-l-rose-500'
          : finding.severity === 'medium'
          ? 'border-l-4 border-l-amber-500'
          : 'border-l-4 border-l-blue-500'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              #{finding.id}
            </span>
            {getSeverityBadge(finding.severity)}
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {finding.category}
            </span>
          </div>

          {/* AI Confidence Meter */}
          <div
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
            title={`AI Model Confidence: ${confidencePercent}%`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium text-[11px]">{confidencePercent}%</span>
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  confidencePercent > 80
                    ? 'bg-emerald-500'
                    : confidencePercent > 60
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
          {finding.title}
        </h3>

        {/* Explanation */}
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-3.5">
          {finding.explanation}
        </p>

        {/* Anchor Quote Box */}
        {finding.anchor && (
          <div className="mb-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <span>Clause § {finding.anchor.paragraphId.replace('p-', '')}</span>
                {finding.anchor.endParagraphId && (
                  <span>to § {finding.anchor.endParagraphId.replace('p-', '')}</span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect();
                  const targetEl = document.getElementById(
                    `paragraph-${finding.anchor?.paragraphId}`
                  );
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 text-[11px] cursor-pointer"
              >
                <span>Jump to text</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="italic text-slate-700 dark:text-slate-300 line-clamp-3 select-text font-serif text-[11px]">
              "{finding.anchor.quote}"
            </p>
          </div>
        )}

        {/* Suggested Edit / Redline Diff Box */}
        {finding.suggestedEdit && (
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-indigo-500" />
                AI Suggested Edit
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDiff(!showDiff);
                }}
                className="text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                {showDiff ? 'Show Clean Text' : 'Show Redline Diff'}
              </button>
            </div>

            {showDiff && finding.anchor ? (
              <InlineDiff
                original={finding.anchor.quote}
                proposed={finding.suggestedEdit}
              />
            ) : (
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs text-emerald-900 dark:text-emerald-200 font-serif">
                "{finding.suggestedEdit}"
              </div>
            )}
          </div>
        )}

        {/* Current Review Status Pill if already acted upon */}
        {(isAccepted || isDismissed) && (
          <div className="mb-3 flex items-center justify-between py-1.5 px-3 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              {isAccepted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Accepted {isApplied && '• Amendment Applied to Text'}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Dismissed as acceptable risk
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isApplied) revertSuggestedEdit(finding.id);
                setStatus(finding.id, 'pending');
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 hover:underline cursor-pointer"
              title="Reset finding status"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {/* Accept / Apply button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (finding.suggestedEdit && !isApplied) {
                  applySuggestedEdit(finding.id);
                } else {
                  setStatus(finding.id, 'accepted');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isAccepted
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {finding.suggestedEdit
                  ? isApplied
                    ? 'Applied'
                    : 'Accept & Apply'
                  : 'Accept'}
              </span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-emerald-200/50 dark:bg-emerald-800/60 rounded">
                A
              </kbd>
            </button>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isApplied) revertSuggestedEdit(finding.id);
                setStatus(finding.id, 'dismissed');
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isDismissed
                  ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Dismiss</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-200 dark:bg-slate-700 rounded">
                D
              </kbd>
            </button>
          </div>

          {/* Toggle Notes Thread Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotes(!showNotes);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              reviewState.notes.length > 0
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {reviewState.notes.length > 0
                ? `${reviewState.notes.length} Note${reviewState.notes.length > 1 ? 's' : ''}`
                : 'Note'}
            </span>
          </button>
        </div>

        {/* Reviewer Notes Section */}
        {showNotes && (
          <div
            className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Presets */}
            <div className="mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Quick Tags
              </span>
              <div className="flex flex-wrap gap-1">
                {QUICK_NOTES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleQuickNote(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Notes Feed */}
            {reviewState.notes.length > 0 && (
              <div className="space-y-2 mb-3">
                {reviewState.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {note.author}
                        </span>
                        <span>•</span>
                        <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200">{note.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteNote(finding.id, note.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Note Input */}
            <form onSubmit={handleAddComment} className="flex gap-1.5">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add reviewer rationale, flag, or counter-term..."
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Save</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
