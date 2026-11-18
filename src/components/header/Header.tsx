import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Scale,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { calculateRiskAnalytics } from '../../utils/riskCalculator';

interface HeaderProps {
  documentTitle?: string;
  vendorName?: string;
  showLeftSidebar?: boolean;
  onToggleLeftSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  vendorName,
  showLeftSidebar = true,
  onToggleLeftSidebar,
}) => {
  const navigate = useNavigate();
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

  const riskReduction = analytics.initialRiskScore - analytics.residualRiskScore;

  const displayTitle = documentTitle || contract.title;
  const displayVendor = vendorName || contract.parties[1]?.name || 'Brightline Data Solutions LLC';

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
    <header className="h-13 px-4 sm:px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0 shadow-md select-none">

      {/* Left: Northwind Logo + Back to Documents + Document Title & Vendor */}
      <div className="flex items-center gap-2.5 min-w-0">

        {/* Northwind Brand */}
        <Link
          to="/"
          className="flex items-center gap-1.5 shrink-0 group hover:opacity-85 transition-opacity"
          title="Back to Northwind Legal AI Dashboard"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-400 transition-colors">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-white hidden sm:inline">
            Northwind
          </span>
        </Link>

        <div className="h-4 w-px bg-slate-700 shrink-0 mx-0.5" />

        {/* Back to Documents */}
        <Link
          to="/documents"
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Return to Documents Portfolio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="font-medium">Documents</span>
        </Link>

        <span className="text-slate-600 shrink-0 font-bold">/</span>

        {/* Sidebar Outline Toggle */}
        {onToggleLeftSidebar && (
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            className="hidden xl:flex p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={showLeftSidebar ? 'Collapse Outline Panel' : 'Expand Outline Panel'}
          >
            {showLeftSidebar ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Document Title & Vendor */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
            {displayTitle}
          </span>
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 shrink-0">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span>
              Vendor: <strong className="text-slate-100">{displayVendor}</strong>
            </span>
          </span>
        </div>
      </div>

      {/* Center: Risk Score & Review Progress */}
      <div className="hidden lg:flex items-center gap-4 shrink-0">

        {/* Risk Score Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
              analytics.residualRiskScore >= 70
                ? 'bg-rose-500/20 text-rose-300'
                : analytics.residualRiskScore >= 40
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {analytics.residualRiskScore}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`font-bold text-xs ${
                analytics.residualRiskScore >= 70
                  ? 'text-rose-400'
                  : analytics.residualRiskScore >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {analytics.riskLevel} Risk
            </span>

            {riskReduction > 0 ? (
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                -{riskReduction} pts
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">
                (Baseline {analytics.initialRiskScore}/100)
              </span>
            )}
          </div>
        </div>

        {/* Progress Mini-bar */}
        <div className="w-36 hidden xl:block">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Reviewed
            </span>
            <span className="font-bold text-slate-300 text-[11px]">
              {analytics.acceptedCount + analytics.dismissedCount} / {analytics.totalFindings} ({analytics.completionPercentage}%)
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

      {/* Right: Speed Review, Shortcuts, Reset, Export Audit, Profile */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Speed Review / Zen Mode */}
        <button
          type="button"
          onClick={() => setZenMode(!zenMode)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            zenMode
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
          }`}
          title="Toggle Zen Speed Review Mode (Z)"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Speed Review</span>
          <kbd className="hidden lg:inline text-[9px] px-1 bg-white/10 rounded">Z</kbd>
        </button>

        {/* Keyboard Shortcuts */}
        <button
          type="button"
          onClick={() => toggleShortcutsModal(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Review State"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Export Audit */}
        <button
          type="button"
          onClick={() => toggleSummaryModal(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        {/* Reviewer Profile */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 pl-1 cursor-pointer hover:opacity-80 transition-opacity"
          title={`Reviewer: ${userSettings.reviewerName} (${userSettings.reviewerRole})`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {userSettings.reviewerName.charAt(0)}
          </div>
          <div className="hidden 2xl:flex flex-col leading-tight">
            <span className="text-xs font-semibold text-white">
              {userSettings.reviewerName}
            </span>
            <span className="text-[10px] text-slate-400">
              {userSettings.reviewerRole.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
