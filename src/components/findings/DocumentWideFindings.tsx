import React from 'react';
import { ShieldAlert, PlusCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { Finding } from '../../types/finding';
import { useReviewStore } from '../../store/useReviewStore';

interface DocumentWideFindingsProps {
  findings: Finding[];
}

export const DocumentWideFindings: React.FC<DocumentWideFindingsProps> = ({ findings }) => {
  const { reviews, setStatus, selectFinding, selectedFindingId } = useReviewStore();

  if (findings.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          Document-Wide / Missing Clauses ({findings.length})
        </h4>
        <span className="text-[11px] text-slate-400">Systemic Risks</span>
      </div>

      <div className="space-y-2.5">
        {findings.map((finding) => {
          const review = reviews[finding.id] || { status: 'pending', notes: [] };
          const isSelected = selectedFindingId === finding.id;
          const isAccepted = review.status === 'accepted';
          const isDismissed = review.status === 'dismissed';

          return (
            <div
              key={finding.id}
              onClick={() => selectFinding(finding.id, null)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200 uppercase">
                    Missing Clause
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {finding.category}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {Math.round(finding.confidence * 100)}% AI Conf.
                </span>
              </div>

              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {finding.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {finding.explanation}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-rose-100 dark:border-rose-950">
                <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Recommendation: Attach standard DPA Schedule</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(finding.id, 'accepted');
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                      isAccepted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAccepted ? 'Added to Redline' : 'Add to SOW'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatus(finding.id, 'dismissed');
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                      isDismissed
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
