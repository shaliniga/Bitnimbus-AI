import React, { useEffect, useRef } from 'react';
import { useReviewStore } from '../../store/useReviewStore';
import { ParagraphBlock } from './ParagraphBlock';
import {
  Building2,
  Calendar,
  FileText,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';

interface DocumentViewerProps {
  showLeftSidebar: boolean;
  onToggleLeftSidebar: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  showLeftSidebar,
  onToggleLeftSidebar,
}) => {
  const { contract, findings, selectedFindingId, highlightedParagraphId } = useReviewStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to paragraph when selected finding changes
  useEffect(() => {
    if (!selectedFindingId) return;

    const finding = findings.find((f) => f.id === selectedFindingId);
    const targetParaId = highlightedParagraphId || finding?.anchor?.paragraphId;

    if (targetParaId) {
      const el = document.getElementById(`paragraph-${targetParaId}`);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [selectedFindingId, highlightedParagraphId, findings]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-slate-100/60 px-4 pb-4 pt-2 dark:bg-slate-950/80 sm:px-6 sm:pb-6 sm:pt-3 lg:px-8 lg:pb-8 lg:pt-3"
    >
      <div className="mx-auto mb-1 flex max-w-4xl justify-start">
        <button
          type="button"
          onClick={onToggleLeftSidebar}
          className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-800 hover:shadow-sm dark:hover:bg-slate-800 dark:hover:text-white xl:flex"
          title={showLeftSidebar ? 'Collapse Contract Outline' : 'Expand Contract Outline'}
          aria-label={showLeftSidebar ? 'Collapse Contract Outline' : 'Expand Contract Outline'}
        >
          {showLeftSidebar ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
          <span>{showLeftSidebar ? 'Collapse outline' : 'Show outline'}</span>
        </button>
      </div>
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 lg:p-12 mb-16">
        {/* Document Formal Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8 mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>Master Agreement Review</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-4">
            {contract.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Effective Date: <strong className="text-slate-700 dark:text-slate-300">{contract.effectiveDate}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>
                Customer: <strong className="text-slate-700 dark:text-slate-300">{contract.parties[0]?.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>
                Vendor: <strong className="text-slate-700 dark:text-slate-300">{contract.parties[1]?.name}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Contract Sections */}
        <div className="space-y-8">
          {contract.sections.map((section) => (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="scroll-mt-8"
            >
              {/* Section Header */}
              <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {section.number && (
                    <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      § {section.number}.
                    </span>
                  )}
                  <span>{section.heading}</span>
                </h2>
              </div>

              {/* Section Paragraphs */}
              <div className="space-y-2">
                {section.paragraphs.map((paragraph) => (
                  <ParagraphBlock
                    key={paragraph.id}
                    paragraph={paragraph}
                    findings={findings}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Document Footer Signatures */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase mb-4">
                Northwind Analytics, Inc. (Customer)
              </p>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 mb-2" />
              <p>Authorized Signature</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase mb-4">
                Brightline Data Solutions LLC (Vendor)
              </p>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 mb-2" />
              <p>Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
