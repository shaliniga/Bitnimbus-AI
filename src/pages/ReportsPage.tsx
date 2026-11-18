import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Download,
  Copy,
  Check,
  Printer,
  FileCheck2,
  TrendingDown,
} from 'lucide-react';
import { useReviewStore } from '../store/useReviewStore';
import { calculateRiskAnalytics } from '../utils/riskCalculator';

export const ReportsPage: React.FC = () => {
  const { contract, findings, reviews } = useReviewStore();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const analytics = useMemo(() => {
    return calculateRiskAnalytics(contract, findings, reviews);
  }, [contract, findings, reviews]);

  const acceptedFindings = findings.filter((f) => reviews[f.id]?.status === 'accepted');

  // Chart 1: Status Resolution Breakdown (Pie)
  const statusPieData = useMemo(() => {
    return [
      { name: 'Accepted & Mitigated', count: analytics.acceptedCount, color: '#10b981' },
      { name: 'Dismissed Risk', count: analytics.dismissedCount, color: '#64748b' },
      { name: 'Pending Review', count: analytics.pendingCount, color: '#f59e0b' },
    ];
  }, [analytics]);

  // Chart 2: Severity Distribution (Bar)
  const severityBarData = useMemo(() => {
    return [
      { name: 'High Risk', count: analytics.severityCounts.high, color: '#f43f5e' },
      { name: 'Medium Risk', count: analytics.severityCounts.medium, color: '#f59e0b' },
      { name: 'Low Risk', count: analytics.severityCounts.low, color: '#6366f1' },
    ];
  }, [analytics]);

  // Chart 3: Findings by Category (Horizontal Bar)
  const categoryBarData = useMemo(() => {
    return Object.entries(analytics.categoryCounts).map(([cat, count]) => ({
      category: cat,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [analytics]);

  // Export handlers
  const handleCopyMarkdown = async () => {
    let md = `# Northwind Analytics — AI Document Review Audit Report\n\n`;
    md += `**Document:** ${contract.title}\n`;
    md += `**Parties:** ${contract.parties[0]?.name} (Customer) & ${contract.parties[1]?.name} (Vendor)\n`;
    md += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
    md += `## Risk Scorecard\n`;
    md += `- Initial Risk Score: ${analytics.initialRiskScore}/100\n`;
    md += `- Residual Risk Score: ${analytics.residualRiskScore}/100 (${analytics.riskLevel})\n`;
    md += `- Status: ${analytics.acceptedCount} Accepted, ${analytics.dismissedCount} Dismissed, ${analytics.pendingCount} Pending\n\n`;
    md += `## Accepted Amendments\n\n`;
    acceptedFindings.forEach((f) => {
      md += `### [${f.id}] § ${f.anchor ? f.anchor.paragraphId.replace('p-', '') : 'Doc-Wide'} — ${f.title}\n`;
      if (f.suggestedEdit !== null) md += `**Agreed Amendment:** "${f.suggestedEdit}"\n\n`;
    });

    if (!navigator.clipboard?.writeText) {
      setCopyError('Clipboard access is unavailable in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError('Copy failed. Check browser permissions and try again.');
    }
  };

  const handleDownloadJSON = () => {
    const exportData = {
      contractTitle: contract.title,
      vendor: contract.parties[1]?.name,
      analytics: {
        initialRiskScore: analytics.initialRiskScore,
        residualRiskScore: analytics.residualRiskScore,
        riskLevel: analytics.riskLevel,
        completionPercentage: analytics.completionPercentage,
      },
      reviews,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${contract.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Review & Audit Reports</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Executive Summary
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive audit trail, risk metrics, and redline negotiation schedules.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown' : 'Copy MD'}</span>
          </button>
          {copyError && (
            <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
              {copyError}
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Risk Overview Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Residual Risk Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {analytics.residualRiskScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
            <span className="text-xs font-bold text-emerald-600 ml-auto flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              -{analytics.initialRiskScore - analytics.residualRiskScore} pts
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Started at {analytics.initialRiskScore}/100 ({analytics.riskLevel} Risk)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Accepted Amendments
          </span>
          <div className="text-3xl font-extrabold text-emerald-600">
            {analytics.acceptedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Replacement text applied to contract
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Dismissed Issues
          </span>
          <div className="text-3xl font-extrabold text-slate-500">
            {analytics.dismissedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Tolerated as acceptable business risk
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Review Completion
          </span>
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {analytics.completionPercentage}%
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {analytics.acceptedCount + analytics.dismissedCount} of {analytics.totalFindings} findings reviewed
          </span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Review Status Pie */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Review Status Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">Disposition of AI-generated findings</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`status-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Severity Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Severity Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown by contract risk gravity</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityBarData.map((entry, index) => (
                    <Cell key={`sev-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>High: {analytics.severityCounts.high}</span>
            <span>Medium: {analytics.severityCounts.medium}</span>
            <span>Low: {analytics.severityCounts.low}</span>
          </div>
        </div>

        {/* Chart 3: Findings by Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Findings by Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">Concentration by legal discipline</p>

          <div className="space-y-2.5 h-64 overflow-y-auto pr-1">
            {categoryBarData.map((cat) => {
              const maxVal = Math.max(...categoryBarData.map((c) => c.count));
              const widthPct = (cat.count / maxVal) * 100;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {cat.category}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] font-semibold">
                      {cat.count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule of Accepted Redline Amendments */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Schedule of Negotiated Amendments ({acceptedFindings.length})
            </h3>
            <p className="text-xs text-slate-500">
              Contract amendments accepted for inclusion into the vendor counter-proposal
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {contract.parties[0]?.name} vs {contract.parties[1]?.name}
          </span>
        </div>

        {acceptedFindings.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No amendments have been accepted yet. As you review issues in the Review Workspace and click "Accept & Apply", proposed clauses will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedFindings.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      #{f.id}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {f.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    § {f.anchor ? f.anchor.paragraphId.replace('p-', '') : 'Document-Wide'}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  {f.explanation}
                </p>

                {f.suggestedEdit && (
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-serif text-[11px] leading-relaxed">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block mb-1">
                      Agreed Replacement Text:
                    </span>
                    <span className="text-emerald-950 dark:text-emerald-200">
                      "{f.suggestedEdit}"
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
