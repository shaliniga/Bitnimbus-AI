import React, { useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { FindingCard } from './FindingCard';
import { DocumentWideFindings } from './DocumentWideFindings';
import type { SortOption } from '../../types/finding';

export const FindingsPanel: React.FC = () => {
  const {
    findings,
    selectedFindingId,
    filters,
    setFilter,
    resetFilters,
    reviews,
    getFilteredFindings,
  } = useReviewStore();

  const filteredFindings = getFilteredFindings();

  // Categorize findings
  const documentWideFindings = useMemo(() => {
    return filteredFindings.filter((f) => !f.anchor);
  }, [filteredFindings]);

  const anchoredFindings = useMemo(() => {
    return filteredFindings.filter((f) => !!f.anchor);
  }, [filteredFindings]);

  // Compute category list
  const categories = useMemo(() => {
    const set = new Set<string>();
    findings.forEach((f) => set.add(f.category));
    return Array.from(set).sort();
  }, [findings]);

  // Compute counts for severity filter tabs
  const severityCounts = useMemo(() => {
    return {
      all: findings.length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
    };
  }, [findings]);

  // Compute counts for status filter tabs
  const statusCounts = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let dismissed = 0;
    findings.forEach((f) => {
      const s = reviews[f.id]?.status || 'pending';
      if (s === 'accepted') accepted++;
      else if (s === 'dismissed') dismissed++;
      else pending++;
    });
    return { all: findings.length, pending, accepted, dismissed };
  }, [findings, reviews]);

  const hasActiveFilters =
    filters.severity !== 'all' ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.search.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/40 border-l border-slate-200 dark:border-slate-800">
      {/* Sticky Panel Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Findings
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {filteredFindings.length} of {findings.length}
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value as SortOption)}
                aria-label="Sort findings"
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs pl-2.5 pr-7 py-1 rounded-md font-medium cursor-pointer border-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="document">Document Order</option>
                <option value="severity-desc">Severity (High to Low)</option>
                <option value="confidence-desc">AI Confidence</option>
                <option value="status">Review Status</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search findings by clause, title, or keywords..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity Tabs */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium mb-2.5">
          {(['all', 'high', 'medium', 'low'] as const).map((sev) => {
            const isActive = filters.severity === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFilter('severity', sev)}
                className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span className="capitalize">{sev}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    sev === 'high'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : sev === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : sev === 'low'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {severityCounts[sev]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filters & Category Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {(['all', 'pending', 'accepted', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter('status', st)}
                className={`text-[11px] px-2 py-0.5 rounded-full capitalize transition-colors cursor-pointer ${
                  filters.status === st
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {st} ({statusCounts[st]})
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="shrink-0 flex items-center gap-1">
            <select
              value={filters.category}
              onChange={(e) => setFilter('category', e.target.value)}
              aria-label="Filter by category"
              className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Filtered view active</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
            >
              <X className="w-3 h-3" />
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Findings Cards Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Document-wide systemic findings (e.g. f-09 missing clause) */}
        {documentWideFindings.length > 0 && (
          <DocumentWideFindings findings={documentWideFindings} />
        )}

        {/* Anchored Findings */}
        {anchoredFindings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            isSelected={selectedFindingId === finding.id}
          />
        ))}

        {/* Empty State */}
        {filteredFindings.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              No findings match your criteria
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
              Try adjusting your search terms, severity tabs, or status filters to surface findings.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
