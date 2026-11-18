import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/header/Header';
import { DocumentMinimap } from '../components/document/DocumentMinimap';
import { DocumentViewer } from '../components/document/DocumentViewer';
import { FindingsPanel } from '../components/findings/FindingsPanel';
import { KeyboardDock } from '../components/common/KeyboardDock';
import { ZenReviewModal } from '../components/zen/ZenReviewModal';
import { KeyboardShortcutsModal } from '../components/modals/KeyboardShortcutsModal';
import { ReviewSummaryModal } from '../components/modals/ReviewSummaryModal';
import { useReviewStore } from '../store/useReviewStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { isSupportedReviewDocument } from '../utils/documentReview';
import { ArrowLeft, FileText, SlidersHorizontal } from 'lucide-react';

export const ReviewWorkspacePage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { zenMode, getDynamicDocuments, contract } = useReviewStore();

  const documents = getDynamicDocuments();
  const currentDoc = useMemo(() => {
    return documents.find((d) => d.id === documentId) ?? null;
  }, [documents, documentId]);
  const isReviewSupported = isSupportedReviewDocument(
    currentDoc,
    documentId,
    contract.id
  );
  useKeyboardNavigation(isReviewSupported);

  const [activeMobileTab, setActiveMobileTab] = useState<'document' | 'findings'>('document');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);

  if (!isReviewSupported) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto mb-4 h-8 w-8 text-slate-400" />
          <h1 className="text-lg font-bold">
            {currentDoc ? currentDoc.name : 'Document unavailable'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {currentDoc
              ? 'This is a demo portfolio entry. A contract and findings dataset are not available for review.'
              : 'This document is not available in the current portfolio.'}
          </p>
          <Link
            to="/documents"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to documents
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Document Workspace Command Bar with breadcrumb and integrated outline toggle */}
      <Header
        documentTitle={currentDoc?.name}
      />

      {/* Mobile Tab Switcher (Visible on < lg screens) */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab('document')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeMobileTab === 'document'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Reader</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab('findings')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeMobileTab === 'findings'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>AI Findings</span>
        </button>
      </div>

      {/* Main 3-Column Review Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Outline & Heatmap */}
        {showLeftSidebar && (
          <div className="hidden xl:block">
            <DocumentMinimap />
          </div>
        )}

        {/* Center Column: Document Reader */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden transition-all ${
            activeMobileTab === 'document' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <DocumentViewer
            showLeftSidebar={showLeftSidebar}
            onToggleLeftSidebar={() => setShowLeftSidebar(!showLeftSidebar)}
          />
        </div>

        {/* Right Column: AI Findings Hub */}
        <div
          className={`w-full lg:w-[420px] xl:w-[460px] flex flex-col h-full overflow-hidden shrink-0 ${
            activeMobileTab === 'findings' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <FindingsPanel />
        </div>
      </main>

      {/* Floating Keyboard Dock */}
      <KeyboardDock />

      {/* Speed Review Zen Mode Modal */}
      {zenMode && <ZenReviewModal />}

      {/* Keyboard Shortcuts Cheatsheet */}
      <KeyboardShortcutsModal />

      {/* Review Summary & Export Report Modal */}
      <ReviewSummaryModal />
    </div>
  );
};
