import React, { useMemo } from 'react';
import { useReviewStore } from '../../store/useReviewStore';
import { calculateRiskAnalytics } from '../../utils/riskCalculator';
import {
  FileText,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const DocumentMinimap: React.FC = () => {
  const { contract, findings, reviews, selectFinding, selectedFindingId } = useReviewStore();

  const analytics = useMemo(() => {
    return calculateRiskAnalytics(contract, findings, reviews);
  }, [contract, findings, reviews]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="w-64 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
      {/* Table of Contents Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          Contract Outline
        </h3>
        <span className="text-[10px] text-slate-400">11 Sections</span>
      </div>

      {/* Sections List with Risk Indicators */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Document-Wide Item */}
        {analytics.documentWideFindings.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (analytics.documentWideFindings[0]) {
                selectFinding(analytics.documentWideFindings[0].id, null);
              }
            }}
            className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between group cursor-pointer ${
              selectedFindingId === 'f-09'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-semibold ring-1 ring-rose-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">Document-Wide Risks</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200">
              {analytics.documentWideFindings.length} missing
            </span>
          </button>
        )}

        <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

        {/* Contract Sections */}
        {analytics.sectionMetrics.map((sec) => {
          const hasHigh = sec.highCount > 0;
          const hasMedium = sec.mediumCount > 0;
          const hasLow = sec.lowCount > 0;

          return (
            <button
              key={sec.sectionId}
              type="button"
              onClick={() => scrollToSection(sec.sectionId)}
              className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate pr-1">
                <span className="font-mono text-[11px] text-slate-400 shrink-0 w-5">
                  {sec.sectionNumber || '•'}
                </span>
                <span className="truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {sec.sectionHeading}
                </span>
              </div>

              {/* Risk Dots */}
              <div className="flex items-center gap-1 shrink-0">
                {sec.totalFindings > 0 ? (
                  <div className="flex items-center gap-1">
                    {hasHigh && (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[9px] font-bold"
                        title={`${sec.highCount} High Risk issue(s)`}
                      >
                        {sec.highCount}
                      </span>
                    )}
                    {hasMedium && (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold"
                        title={`${sec.mediumCount} Medium Risk issue(s)`}
                      >
                        {sec.mediumCount}
                      </span>
                    )}
                    {hasLow && (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold"
                        title={`${sec.lowCount} Low Risk issue(s)`}
                      >
                        {sec.lowCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                )}
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Review Velocity & AI Agent Badge */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            AI Agent
          </span>
          <span className="text-[10px] text-slate-400 font-mono">v2.3.1</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          Reviewed by Contract Review Agent on 24 clauses with 93% top confidence.
        </p>
      </div>
    </aside>
  );
};
