import { useState } from 'react';
import { Header } from './components/header/Header';
import { DocumentMinimap } from './components/document/DocumentMinimap';
import { DocumentViewer } from './components/document/DocumentViewer';
import { FindingsPanel } from './components/findings/FindingsPanel';
import { KeyboardDock } from './components/common/KeyboardDock';
import { ZenReviewModal } from './components/zen/ZenReviewModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { ReviewSummaryModal } from './components/modals/ReviewSummaryModal';
import { useReviewStore } from './store/useReviewStore';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { FileText, SlidersHorizontal, PanelLeftClose, PanelLeft } from 'lucide-react';

export function App() {
  useKeyboardNavigation();
  const { zenMode } = useReviewStore();

  const [activeMobileTab, setActiveMobileTab] = useState<'document' | 'findings'>('document');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased">
      {/* Top Navigation & Executive Risk Barometer */}
      <Header />

      {/* Mobile Tab Switcher (Visible on < lg screens) */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveMobileTab('document')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeMobileTab === 'document'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/30'
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
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/30'
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
          {/* Subtle toggle for left sidebar on desktop */}
          <div className="hidden xl:flex items-center px-4 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 justify-between">
            <button
              type="button"
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              title="Toggle Outline Sidebar"
            >
              {showLeftSidebar ? (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5" />
                  <span>Hide Outline</span>
                </>
              ) : (
                <>
                  <PanelLeft className="w-3.5 h-3.5" />
                  <span>Show Outline</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400">
              Click any highlighted span to jump to the AI finding
            </span>
          </div>

          <DocumentViewer />
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
}

export default App;
