import React, { useMemo } from 'react';
import {
  FileText,
  TrendingDown,
  Download,
  Keyboard,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { calculateRiskAnalytics } from '../../utils/riskCalculator';

export const Header: React.FC = () => {
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
        'Are you sure you want to reset all review progress, accepted amendments, and notes?'
      )
    ) {
      resetAllReviews();
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Brand & Document Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-xs">
          <FileText className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Northwind Analytics
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Legal Copilot
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">
            MSA • Brightline Data Solutions
          </p>
        </div>
      </div>

      {/* Center: Executive Risk Barometer & Progress */}
      <div className="hidden md:flex items-center gap-6">
        {/* Risk Score Gauge */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                analytics.residualRiskScore >= 70
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : analytics.residualRiskScore >= 40
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {analytics.residualRiskScore}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Risk Level
                </span>
                <span
                  className={`text-xs font-bold ${
                    analytics.residualRiskScore >= 70
                      ? 'text-rose-600 dark:text-rose-400'
                      : analytics.residualRiskScore >= 40
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {analytics.riskLevel}
                </span>
              </div>

              {riskReduction > 0 ? (
                <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <TrendingDown className="w-3 h-3" />
                  <span>Mitigated -{riskReduction} pts</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Initial score: {analytics.initialRiskScore}/100
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Review Progress Ring / Bar */}
        <div className="w-48">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Review Progress
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
              {analytics.acceptedCount + analytics.dismissedCount} / {analytics.totalFindings} ({analytics.completionPercentage}%)
            </span>
          </div>

          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
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

      {/* Right Action Controls */}
      <div className="flex items-center gap-2">
        {/* Speed Review / Zen Mode Toggle */}
        <button
          type="button"
          onClick={() => setZenMode(!zenMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
