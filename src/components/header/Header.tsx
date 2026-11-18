import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Keyboard,
  Zap,
  RotateCcw,
  ArrowLeft,
  MoreHorizontal,
  Scale,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { calculateRiskAnalytics } from '../../utils/riskCalculator';

interface HeaderProps {
  documentTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
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
    userSettings,
  } = useReviewStore();

  const analytics = useMemo(() => {
    return calculateRiskAnalytics(contract, findings, reviews);
  }, [contract, findings, reviews]);

  const displayTitle = documentTitle || contract.title;

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
    <header className="h-15 px-2 sm:px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1 sm:gap-3 z-20 shrink-0 shadow-md select-none">

      {/* Left: Brand Icon + Back to Documents + Document Title */}
      <div className="flex items-center gap-2 min-w-0">

        {/* Brand Icon */}
        <Link
          to="/"
          className="flex items-center gap-1.5 shrink-0 group hover:opacity-85 transition-opacity"
          title="Back to Dashboard"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-400 transition-colors">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </Link>

        <div className="hidden h-4 w-px bg-slate-700 shrink-0 mx-0.5 sm:block" />

        {/* Back to Documents */}
        <Link
          to="/documents"
          className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Return to Documents Portfolio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden font-medium sm:inline">Documents</span>
        </Link>

        <span className="hidden text-slate-600 shrink-0 font-bold sm:inline">/</span>

        {/* Document Title */}
        <div className="hidden min-w-0 sm:block">
          <span
            className="block max-w-[180px] truncate text-sm font-semibold text-white sm:max-w-xs sm:text-base md:max-w-sm"
            title={displayTitle}
          >
            {displayTitle}
          </span>
        </div>
      </div>

      {/* Center: Risk Score & Review Progress */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">

        {/* Risk Score Pill */}
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-1"
          title={`Risk score: ${analytics.residualRiskScore}/100`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
              analytics.residualRiskScore >= 70
                ? 'bg-rose-500/20 text-rose-300'
                : analytics.residualRiskScore >= 40
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {analytics.residualRiskScore}
          </div>

          <div className="text-sm">
            <span
              className={`font-bold text-sm ${
                analytics.residualRiskScore >= 70
                  ? 'text-rose-400'
                  : analytics.residualRiskScore >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {analytics.riskLevel} Risk
            </span>
          </div>
        </div>

        {/* Progress Mini-bar */}
        <div className="hidden w-32 xl:block">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Reviewed
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {analytics.acceptedCount + analytics.dismissedCount}/{analytics.totalFindings}
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(analytics.acceptedCount / analytics.totalFindings) * 100}%` }}
              title={`${analytics.acceptedCount} Accepted`}
            />
            <div
              className="h-full bg-slate-500 transition-all duration-300"
              style={{ width: `${(analytics.dismissedCount / analytics.totalFindings) * 100}%` }}
              title={`${analytics.dismissedCount} Dismissed`}
            />
          </div>
        </div>
      </div>

      {/* Right: Primary Actions and Profile */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Speed Review / Zen Mode */}
        <button
          type="button"
          onClick={() => setZenMode(!zenMode)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
            zenMode
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Toggle Zen Speed Review Mode (Z)"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Speed Review</span>
          <kbd className="hidden lg:inline text-[10px] px-1 bg-white/10 rounded">Z</kbd>
        </button>

        {/* Export Audit */}
        <button
          type="button"
          onClick={() => toggleSummaryModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <details className="relative">
          <summary
            className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="More review actions"
            aria-label="More review actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => toggleShortcutsModal(true)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Keyboard className="h-4 w-4" />
              Keyboard shortcuts
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-rose-300"
            >
              <RotateCcw className="h-4 w-4" />
              Reset review
            </button>
          </div>
        </details>

        {/* Reviewer Profile */}
        <Link
          to="/settings"
          className="flex items-center gap-1.5 pl-1 cursor-pointer hover:opacity-80 transition-opacity"
          title={`Reviewer: ${userSettings.reviewerName} (${userSettings.reviewerRole})`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {userSettings.reviewerName.charAt(0)}
          </div>
          <div className="hidden 2xl:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">
              {userSettings.reviewerName}
            </span>
            <span className="text-xs text-slate-400">
              {userSettings.reviewerRole.split(' ')[0]}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};
