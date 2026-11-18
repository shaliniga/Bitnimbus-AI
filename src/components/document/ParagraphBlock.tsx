import React, { useMemo, useState } from 'react';
import type { ContractParagraph } from '../../types/contract';
import type { Finding, FindingSeverity } from '../../types/finding';
import { useReviewStore } from '../../store/useReviewStore';
import {
  getParagraphFindingRanges,
  splitParagraphIntoSegments,
  type TextSegment,
} from '../../utils/spanSplitter';
import { Check, RotateCcw, Layers } from 'lucide-react';

interface ParagraphBlockProps {
  paragraph: ContractParagraph;
  findings: Finding[];
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({
  paragraph,
  findings,
}) => {
  const {
    selectedFindingId,
    selectFinding,
    originalParagraphs,
    contract,
    reviews,
    revertSuggestedEdit,
  } = useReviewStore();

  const [activeOverlapPopover, setActiveOverlapPopover] = useState<string | null>(null);

  // Check if this paragraph was amended
  const originalText = originalParagraphs[paragraph.id];
  const isAmended = !!originalText && originalText !== paragraph.text;

  // Split paragraph text into annotated segments
  const segments: TextSegment[] = useMemo(() => {
    const allParagraphs = contract.sections.flatMap(
      (section) => section.paragraphs
    );
    const ranges = getParagraphFindingRanges(
      paragraph.id,
      paragraph.text,
      findings,
      allParagraphs
    );
    return splitParagraphIntoSegments(paragraph.text, ranges);
  }, [contract.sections, paragraph.id, paragraph.text, findings]);

  // Find if any finding applied an edit to this paragraph
  const appliedFinding = useMemo(() => {
    for (const finding of findings) {
      if (
        finding.anchor?.paragraphId === paragraph.id &&
        reviews[finding.id]?.isEditApplied
      ) {
        return finding;
      }
    }
    return null;
  }, [findings, paragraph.id, reviews]);

  const getSegmentStyles = (
    segment: TextSegment,
    isCurrentFindingSelected: boolean
  ) => {
    const sev = segment.highestSeverity;

    if (isCurrentFindingSelected) {
      return 'bg-amber-200/90 dark:bg-amber-500/40 border-b-2 border-indigo-600 dark:border-indigo-400 font-medium ring-2 ring-indigo-500/30 shadow-xs cursor-pointer';
    }

    if (segment.isOverlapping) {
      return 'bg-purple-100/90 dark:bg-purple-950/70 border-b-2 border-purple-500 text-purple-950 dark:text-purple-100 cursor-pointer';
    }

    switch (sev) {
      case 'high':
        return 'bg-rose-100/80 hover:bg-rose-200/90 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border-b-2 border-rose-500 text-slate-900 dark:text-slate-100 cursor-pointer';
      case 'medium':
        return 'bg-amber-100/80 hover:bg-amber-200/90 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border-b-2 border-amber-500 text-slate-900 dark:text-slate-100 cursor-pointer';
      case 'low':
        return 'bg-blue-100/80 hover:bg-blue-200/90 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border-b-2 border-blue-500 text-slate-900 dark:text-slate-100 cursor-pointer';
      default:
        return '';
    }
  };

  const getSeverityPill = (sev: FindingSeverity) => {
    switch (sev) {
      case 'high':
        return 'bg-rose-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div
      id={`paragraph-${paragraph.id}`}
      className={`group relative py-3 px-4 sm:px-5 rounded-xl transition-all duration-200 mb-3 border ${
        isAmended
          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50'
          : 'bg-white dark:bg-slate-900/70 border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
      }`}
    >
      {/* Paragraph Header with Section Number and Amended Flag */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            {paragraph.number ? `§ ${paragraph.number}` : paragraph.id}
          </span>

          {isAmended && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
              <Check className="w-3 h-3" />
              Amended by Reviewer
            </span>
          )}
        </div>

        {/* Revert amendment action */}
        {appliedFinding && (
          <button
            type="button"
            onClick={() => revertSuggestedEdit(appliedFinding.id)}
            className="text-[11px] font-sans text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            title="Revert to original text"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Revert to original</span>
          </button>
        )}
      </div>

      {/* Paragraph Body with Split Highlights */}
      <div className="font-serif text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 selection:bg-indigo-100 dark:selection:bg-indigo-950">
        {segments.map((seg, idx) => {
          if (seg.findingIds.length === 0) {
            return <span key={idx}>{seg.text}</span>;
          }

          const isCurrentSelected =
            selectedFindingId !== null && seg.findingIds.includes(selectedFindingId);

          return (
            <span
              key={idx}
              className={`relative inline transition-all duration-150 rounded-2xs px-0.5 ${getSegmentStyles(
                seg,
                isCurrentSelected
              )}`}
              onClick={(e) => {
                e.stopPropagation();
                if (seg.findingIds.length === 1) {
                  selectFinding(seg.findingIds[0], paragraph.id);
                } else {
                  // If overlapping, toggle popover or select next
                  setActiveOverlapPopover(
                    activeOverlapPopover === `${idx}` ? null : `${idx}`
                  );
                  selectFinding(seg.findingIds[0], paragraph.id);
                }
              }}
              title={
                seg.findings.length === 1
                  ? `[${seg.findings[0].severity.toUpperCase()}] ${seg.findings[0].title}`
                  : `${seg.findings.length} overlapping findings`
              }
            >
              {seg.text}

              {/* Overlapping badge indicator */}
              {seg.isOverlapping && (
                <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-sans font-bold bg-purple-600 text-white select-none align-middle shadow-2xs">
                  <Layers className="w-2.5 h-2.5" />
                  {seg.findingIds.length}
                </span>
              )}

              {/* Single finding badge when selected */}
              {isCurrentSelected && !seg.isOverlapping && (
                <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-indigo-600 text-white select-none align-middle shadow-2xs">
                  #{selectedFindingId}
                </span>
              )}

              {/* Overlapping Findings Popup Menu */}
              {activeOverlapPopover === `${idx}` && (
                <span
                  className="absolute left-0 bottom-full mb-1 z-30 w-64 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 text-xs font-sans block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    Overlapping Issues ({seg.findings.length})
                  </span>
                  <span className="space-y-1 block">
                    {seg.findings.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          selectFinding(f.id, paragraph.id);
                          setActiveOverlapPopover(null);
                        }}
                        className={`w-full text-left p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                          selectedFindingId === f.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-600'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{f.title}</span>
                        <span
                          className={`text-[9px] px-1 rounded uppercase font-bold shrink-0 ${getSeverityPill(
                            f.severity
                          )}`}
                        >
                          {f.severity}
                        </span>
                      </button>
                    ))}
                  </span>
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};
