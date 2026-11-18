import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ExternalLink,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useReviewStore } from '../store/useReviewStore';
import { calculateRiskAnalytics } from '../utils/riskCalculator';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { contract, findings, reviews, getDynamicDocuments, activityLog } = useReviewStore();

  const documents = getDynamicDocuments();

  const analytics = useMemo(() => {
    return calculateRiskAnalytics(contract, findings, reviews);
  }, [contract, findings, reviews]);

  // Dynamically calculate metrics across all documents
  const totalDocuments = documents.length;
  const completedReviews = documents.filter((d) => d.status === 'Completed').length;
  const pendingReviews = documents.filter((d) => d.status === 'Pending Review' || d.status === 'In Progress').length;
  const highRiskDocuments = documents.filter((d) => d.riskLevel === 'Critical' || d.riskLevel === 'High').length;

  // Chart data: Risk Distribution across documents
  const riskDistributionData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Moderate: 0, Low: 0 };
    documents.forEach((d) => {
      counts[d.riskLevel] = (counts[d.riskLevel] || 0) + 1;
    });

    return [
      { name: 'Critical', count: counts.Critical, color: '#e11d48' },
      { name: 'High', count: counts.High, color: '#f59e0b' },
      { name: 'Moderate', count: counts.Moderate, color: '#3b82f6' },
      { name: 'Low', count: counts.Low, color: '#10b981' },
    ];
  }, [documents]);

  // Chart data: Findings Severity breakdown for the active MSA
  const findingsSeverityData = useMemo(() => {
    return [
      { name: 'High Risk', count: analytics.severityCounts.high, color: '#f43f5e' },
      { name: 'Medium Risk', count: analytics.severityCounts.medium, color: '#f59e0b' },
      { name: 'Low Risk', count: analytics.severityCounts.low, color: '#6366f1' },
    ];
  }, [analytics]);

  const primaryDoc = documents.find((d) => d.isPrimary) || documents[0];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Legal Operations Review Hub</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Live Copilot
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time AI contract risk triage, negotiation redlines, and compliance audit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>All Documents</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/review/${primaryDoc.id}`)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Active Review</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Contracts
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {totalDocuments}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Active Portfolio
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Vendor MSAs, DPAs, SLAs & NDAs
          </p>
        </div>

        {/* Card 2: Completed Reviews */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Reviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {completedReviews}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({Math.round((completedReviews / totalDocuments) * 100)}% finalized)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Sign-off granted & redlines exported
          </p>
        </div>

        {/* Card 3: Pending Reviews */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Action
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {pendingReviews}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Awaiting Triage
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Includes Brightline MSA ({analytics.pendingCount} findings)
          </p>
        </div>

        {/* Card 4: High Risk Documents */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              High Risk Agreements
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {highRiskDocuments}
            </span>
            <span className="text-xs font-semibold text-rose-600">
              Critical Exposure
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Uncapped liability or data privacy gaps
          </p>
        </div>
      </div>

      {/* Featured Review Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500 text-white shadow-xs">
              Primary In-Flight Review
            </span>
            <span className="text-xs text-indigo-200">
              Vendor: {primaryDoc.vendor}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold">
            {primaryDoc.name}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            AI agent analyzed 11 clauses and flagged liability cap limits, data return timelines, and missing DPA clauses.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Residual Risk:</span>
              <strong className="text-amber-400 font-bold">
                {analytics.residualRiskScore}/100 ({analytics.riskLevel})
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Progress:</span>
              <strong className="text-emerald-400 font-bold">
                {analytics.acceptedCount + analytics.dismissedCount} of {analytics.totalFindings} reviewed ({analytics.completionPercentage}%)
              </strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/review/${primaryDoc.id}`)}
            className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Resume Review Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Document Risk Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Portfolio Risk Distribution
              </h3>
              <p className="text-xs text-slate-500">Contract tiering by risk exposure level</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              5 Documents
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Findings by Severity (Active Review) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Active Agreement Findings Breakdown
              </h3>
              <p className="text-xs text-slate-500">Brightline Data Solutions MSA (24 issues)</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Contract Agent v2.3.1
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={findingsSeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {findingsSeverityData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
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

          <div className="flex items-center justify-center gap-6 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              High ({analytics.severityCounts.high})
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Medium ({analytics.severityCounts.medium})
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Low ({analytics.severityCounts.low})
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Documents & Real-Time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Documents */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Legal Agreements
              </h3>
              <p className="text-xs text-slate-500">Quickly jump into contract review workspaces</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="pb-2.5">Document</th>
                  <th className="pb-2.5">Vendor</th>
                  <th className="pb-2.5">Risk Level</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.slice(0, 4).map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/review/${doc.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <span>{doc.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Uploaded {doc.uploadDate}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {doc.vendor}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          doc.riskLevel === 'Critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : doc.riskLevel === 'High'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : doc.riskLevel === 'Moderate'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {doc.riskLevel}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          doc.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : doc.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/review/${doc.id}`);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Real-Time Activity Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Review Activity
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Live Audit</span>
            </div>

            <div className="space-y-3">
              {activityLog.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug line-clamp-2">
                    {act.description}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span>{act.author}</span>
                    <span className="text-indigo-500 font-medium">{act.documentName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Audit trail persisted in LocalStorage</span>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
