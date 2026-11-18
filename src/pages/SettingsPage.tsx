import React, { useState } from 'react';
import {
  User,
  Bell,
  Save,
  Check,
  RotateCcw,
  FileDown,
} from 'lucide-react';
import { useReviewStore } from '../store/useReviewStore';

export const SettingsPage: React.FC = () => {
  const { userSettings, updateUserSettings, resetAllReviews } = useReviewStore();

  const [name, setName] = useState(userSettings.reviewerName);
  const [role, setRole] = useState(userSettings.reviewerRole);
  const [email, setEmail] = useState(userSettings.email);
  const [department, setDepartment] = useState(userSettings.department);
  const [emailNotifs, setEmailNotifs] = useState(userSettings.emailNotifications);
  const [highRiskAlerts, setHighRiskAlerts] = useState(userSettings.highRiskAlerts);
  const [autoSave, setAutoSave] = useState(userSettings.autoSaveReviewDrafts);
  const [exportFormat, setExportFormat] = useState(userSettings.exportFormat);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserSettings({
      reviewerName: name,
      reviewerRole: role,
      email,
      department,
      emailNotifications: emailNotifs,
      highRiskAlerts,
      autoSaveReviewDrafts: autoSave,
      exportFormat,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetWorkspace = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all review statuses, notes, and accepted amendments back to default?'
      )
    ) {
      resetAllReviews();
      alert('Review workspace state has been reset.');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Platform Settings & Reviewer Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your legal operations workflow, notifications, and export preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Reviewer Profile */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Reviewer Profile
              </h3>
              <p className="text-xs text-slate-500">Your details attached to contract notes and audit logs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Official Title / Role
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Department / Practice Group
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notification & Export Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Notification & Export Preferences
              </h3>
              <p className="text-xs text-slate-500">Configure alert thresholds and automated audit persistence</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Critical & High Risk Finding Alerts
                </span>
                <span className="text-[11px] text-slate-400">
                  Surface prominent banners when severe liability or IP risks are identified
                </span>
              </div>
              <input
                type="checkbox"
                checked={highRiskAlerts}
                onChange={(e) => setHighRiskAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Email Notifications on Review Completion
                </span>
                <span className="text-[11px] text-slate-400">
                  Send negotiation redline schedule when 100% of findings are resolved
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Auto-Save Review Drafts in LocalStorage
                </span>
                <span className="text-[11px] text-slate-400">
                  Preserve accepted amendments and collaboration notes across page reloads
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Default Export Redline Format
                </span>
                <span className="text-[11px] text-slate-400">
                  Format generated when clicking quick export buttons
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-slate-400" />
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'markdown' | 'json' | 'pdf')}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="markdown">Markdown (.md)</option>
                  <option value="json">JSON Audit Log (.json)</option>
                  <option value="pdf">Print Ready PDF</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Maintenance & Data Reset */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Reset Review Workspace State
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clears LocalStorage and resets all 24 findings, amendments, and reviewer notes.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetWorkspace}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Workspace</span>
          </button>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings successfully saved!
            </span>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
