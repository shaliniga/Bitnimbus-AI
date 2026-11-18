import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  X,
  FileText,
  Building2,
  ArrowRight,
  Trash2,
  FileUp,
} from 'lucide-react';
import { useReviewStore } from '../store/useReviewStore';
import type { DocumentItem, DocumentRiskLevel, DocumentReviewStatus } from '../types/document';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getDynamicDocuments, addDocument, deleteDocument } = useReviewStore();

  const documents = getDynamicDocuments();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadVendor, setUploadVendor] = useState('');
  const [uploadType, setUploadType] = useState('Vendor Master Agreement');

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedRisk !== 'all' && doc.riskLevel !== selectedRisk) {
        return false;
      }
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchVendor = doc.vendor.toLowerCase().includes(q);
        const matchTags = doc.tags?.some((t) => t.toLowerCase().includes(q)) || false;
        if (!matchName && !matchVendor && !matchTags) return false;
      }
      return true;
    });
  }, [documents, selectedRisk, selectedStatus, searchQuery]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadVendor.trim()) return;

    const newDoc: DocumentItem = {
      id: `demo-${Date.now()}`,
      name: uploadTitle.trim(),
      type: uploadType,
      vendor: uploadVendor.trim(),
      counterparty: 'Not specified',
      uploadDate: new Date().toISOString().slice(0, 10),
      effectiveDate: 'Not provided',
      riskLevel: 'Unassessed',
      status: 'Demo Only',
      findingCount: 0,
      acceptedCount: 0,
      dismissedCount: 0,
      pendingCount: 0,
      tags: ['Metadata only'],
    };

    addDocument(newDoc);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadVendor('');
  };

  const getRiskBadge = (risk: DocumentRiskLevel) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'Moderate':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'Low':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'Unassessed':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: DocumentReviewStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900';
      case 'Pending Review':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Demo Only':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Contract Portfolio</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredDocuments.length} Documents
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review the supported MSA or browse demo-only portfolio metadata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Add Portfolio Entry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contract name, vendor, or tag..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-400 hidden lg:inline">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              aria-label="Filter by Risk Level"
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-400 hidden lg:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Demo Only">Demo Only</option>
            </select>
          </div>

          {(selectedRisk !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedRisk('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Documents Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Document Name</th>
                <th className="py-3 px-4">Vendor / Party</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">AI Findings</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocuments.map((doc) => {
                const total = doc.findingCount;
                const completed = doc.acceptedCount + doc.dismissedCount;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <tr
                    key={doc.id}
                    onClick={() => {
                      if (doc.isPrimary && doc.id === 'msa-northwind-brightline-2026') {
                        navigate(`/review/${doc.id}`);
                      }
                    }}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${
                      doc.isPrimary ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Title & Type */}
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {doc.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {doc.type}
                            </span>
                            {doc.fileSize && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400">{doc.fileSize}</span>
                              </>
                            )}
                          </div>
                          {!doc.isPrimary && (
                            <span className="mt-1 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Demo only - no contract data
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.vendor}</span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shadow-2xs ${getRiskBadge(
                          doc.riskLevel
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {doc.riskLevel}
                      </span>
                    </td>

                    {/* Review Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    {/* Finding Count & Progress */}
                    <td className="py-4 px-4">
                      <div className="w-36">
                        {doc.findingCount === 0 ? (
                          <span className="text-[11px] text-slate-400">
                            No review data
                          </span>
                        ) : (
                          <>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {completed} / {total} reviewed
                          </span>
                          <span className="text-slate-400 font-mono">{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${total ? (doc.acceptedCount / total) * 100 : 0}%` }}
                          />
                          <div
                            className="h-full bg-slate-400"
                            style={{ width: `${total ? (doc.dismissedCount / total) * 100 : 0}%` }}
                          />
                        </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Upload Date */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {doc.uploadDate}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={!doc.isPrimary}
                          onClick={() => navigate(`/review/${doc.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                          title={doc.isPrimary ? 'Open supported review' : 'This demo entry has no contract or findings data'}
                        >
                          <span>{doc.isPrimary ? 'Review' : 'Demo only'}</span>
                          {doc.isPrimary && <ArrowRight className="w-3 h-3" />}
                        </button>

                        {!doc.isPrimary && (
                          <button
                            type="button"
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No agreements match your search or filter</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filter parameters</p>
          </div>
        )}
      </div>

      {/* Upload Contract Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Add Portfolio Entry
                  </h3>
                  <p className="text-xs text-slate-500">Metadata only; contract parsing and review are not available</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                This form creates a demo portfolio entry only. It does not upload,
                parse, or analyze a contract.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Contract Agreement Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Master Cloud Platform Agreement"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Vendor / Counterparty
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadVendor}
                    onChange={(e) => setUploadVendor(e.target.value)}
                    placeholder="e.g. Acme Cloud Corp"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Agreement Type
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Master Services Agreement">Master Services Agreement</option>
                    <option value="Data Processing Addendum">Data Processing Addendum</option>
                    <option value="Service Level Agreement">Service Level Agreement</option>
                    <option value="Non-Disclosure Agreement">Non-Disclosure Agreement</option>
                    <option value="Security Addendum">Security Addendum</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Add Demo Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
