import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingDown,
  Download,
  Keyboard,
  Zap,
  RotateCcw,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
  Building2,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { calculateRiskAnalytics } from '../../utils/riskCalculator';

interface HeaderProps {
  showLeftSidebar?: boolean;
  onToggleLeftSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showLeftSidebar = true,
  onToggleLeftSidebar,
}) => {
  const {
    contract,
    findings,
    reviews,
    zenMode,
    setZenMode,
    toggleSummaryModal,
    toggleShortcutsModal,
    resetAllReviews,
  } = useReviewStore();

  const analytics = useMemo(() => {
    return calculateRiskAnalytics(contract, findings, reviews);
  }, [contract, findings, reviews]);

  const riskReduction = analytics.initialRiskScore - analytics.residualRiskScore;

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all review progress, accepted amendments, and notes for this agreement?'
      )
    ) {
      resetAllReviews();
    }
  };

  return (
    <header className="h-12 px-4 sm:px-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0 shadow-2xs">
      {/* Left: Document Breadcrumb & Outline Toggle (Clean workspace breadcrumb) */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleLeftSidebar && (
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            className="hidden xl:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={showLeftSidebar ? 'Collapse Outline Sidebar' : 'Expand Outline Sidebar'}
          >
            {showLeftSidebar ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        )}

        <Link
          to="/documents"
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline transition-colors shrink-0"
          title="Back to Documents Portfolio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Documents</span>
        </Link>

        <span className="text-slate-300 dark:text-slate-700 shrink-0 font-bold">/</span>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
            {contract.title}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 truncate">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>Vendor: <strong className="text-slate-800 dark:text-slate-200">{contract.parties[1]?.name}</strong></span>
          </span>
        </div>
      </div>

      {/* Center: Executive Risk Barometer & Progress */}
      <div className="hidden lg:flex items-center gap-4 shrink-0">
        {/* Risk Score Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
              analytics.residualRiskScore >= 70
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : analytics.residualRiskScore >= 40
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {analytics.residualRiskScore}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`font-bold text-xs ${
                analytics.residualRiskScore >= 70
                  ? 'text-rose-600 dark:text-rose-400'
                  : analytics.residualRiskScore >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {analytics.riskLevel} Risk
            </span>

            {riskReduction > 0 ? (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                -{riskReduction} pts
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                (Baseline {analytics.initialRiskScore}/100)
              </span>
            )}
          </div>
        </div>

        {/* Progress Mini-bar */}
        <div className="w-36">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Reviewed
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              {analytics.acceptedCount + analytics.dismissedCount} / {analytics.totalFindings} ({analytics.completionPercentage}%)
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(analytics.acceptedCount / analytics.totalFindings) * 100}%`,
              }}
              title={`${analytics.acceptedCount} Accepted`}
            />
            <div
              className="h-full bg-slate-400 dark:bg-slate-500 transition-all duration-300"
              style={{
                width: `${(analytics.dismissedCount / analytics.totalFindings) * 100}%`,
              }}
              title={`${analytics.dismissedCount} Dismissed`}
            />
          </div>
        </div>
      </div>

      {/* Right: Workspace Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Speed Review / Zen Mode Toggle */}
        <button
          type="button"
          onClick={() => setZenMode(!zenMode)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            zenMode
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
          }`}
          title="Toggle Zen Speed Review Mode (Z)"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Speed Review</span>
          <kbd className="hidden lg:inline text-[9px] px-1 bg-black/10 dark:bg-white/10 rounded">
            Z
          </kbd>
        </button>

        {/* Keyboard Shortcuts Guide */}
        <button
          type="button"
          onClick={() => toggleShortcutsModal(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Reset State */}
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Review State"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Export / Audit Summary */}
        <button
          type="button"
          onClick={() => toggleSummaryModal(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit</span>
        </button>
      </div>
    </header>
  );
};
