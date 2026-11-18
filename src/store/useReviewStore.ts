import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContractDocument } from '../types/contract';
import type {
  Finding,
  FindingReviewState,
  ReviewStatus,
  FilterState,
  FindingsDataset,
} from '../types/finding';
import type {
  DocumentItem,
  ActivityLogItem,
  DocumentRiskLevel,
  DocumentReviewStatus,
} from '../types/document';
import { calculateRiskAnalytics } from '../utils/riskCalculator.ts';
import {
  applyTextEditOperations,
  buildFindingEditOperations,
  hasConflictingEdits,
  type TextEditOperation,
} from '../utils/amendments.ts';
import {
  isRecord,
  restoreReviewDraft,
  sanitizeOriginalParagraphs,
  sanitizeReviews,
} from '../utils/reviewPersistence.ts';

import initialContractData from '../assets/sample-contract.json' with { type: 'json' };
import initialFindingsData from '../assets/findings.json' with { type: 'json' };

export interface UserSettings {
  reviewerName: string;
  reviewerRole: string;
  email: string;
  department: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  highRiskAlerts: boolean;
  autoSaveReviewDrafts: boolean;
  exportFormat: 'markdown' | 'json' | 'pdf';
}

interface ReviewStoreState {
  contract: ContractDocument;
  originalParagraphs: Record<string, string>; // paragraphId -> original plain text
  findings: Finding[];
  agentMeta: {
    name: string;
    version: string;
    generatedAt: string;
  };
  reviews: Record<string, FindingReviewState>;
  selectedFindingId: string | null;
  highlightedParagraphId: string | null;
  filters: FilterState;
  zenMode: boolean;
  showSummaryModal: boolean;
  showShortcutsModal: boolean;

  // Multi-document & enterprise platform state
  documents: DocumentItem[];
  activityLog: ActivityLogItem[];
  userSettings: UserSettings;

  // Actions
  selectFinding: (
    findingId: string | null,
    highlightParagraph?: string | null
  ) => void;
  setStatus: (findingId: string, status: ReviewStatus) => void;
  addNote: (findingId: string, text: string, author?: string) => void;
  deleteNote: (findingId: string, noteId: string) => void;
  applySuggestedEdit: (findingId: string) => boolean;
  revertSuggestedEdit: (findingId: string) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  resetAllReviews: () => void;
  setZenMode: (enabled: boolean) => void;
  toggleSummaryModal: (open?: boolean) => void;
  toggleShortcutsModal: (open?: boolean) => void;
  nextFinding: () => void;
  prevFinding: () => void;
  getFilteredFindings: () => Finding[];

  // Document & Platform actions
  addDocument: (doc: DocumentItem) => void;
  deleteDocument: (id: string) => void;
  logActivity: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  getDynamicDocuments: () => DocumentItem[];
}

const defaultFilters: FilterState = {
  severity: 'all',
  category: 'all',
  status: 'all',
  search: '',
  sort: 'document',
};

const initialContract = initialContractData as unknown as ContractDocument;
const initialFindingsDataset = initialFindingsData as unknown as FindingsDataset;
const initialFindings = initialFindingsDataset.findings;

function cloneContract(contract: ContractDocument): ContractDocument {
  return {
    ...contract,
    parties: contract.parties.map((party) => ({ ...party })),
    sections: contract.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph) => ({ ...paragraph })),
    })),
  };
}

const initialDocuments: DocumentItem[] = [
  {
    id: 'msa-northwind-brightline-2026',
    name: 'Master Services Agreement (MSA)',
    type: 'Master Services Agreement',
    vendor: 'Brightline Data Solutions LLC',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-03-01',
    effectiveDate: '2026-03-01',
    riskLevel: 'Critical',
    status: 'In Progress',
    findingCount: 24,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 24,
    isPrimary: true,
    tags: ['Data Processing', 'Analytics', 'Vendor SOW'],
  },
  {
    id: 'saas-cyberguard-2026',
    name: 'Enterprise Security Services Agreement',
    type: 'Security SaaS Agreement',
    vendor: 'CyberGuard Technologies Inc.',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-03-04',
    effectiveDate: '2026-03-15',
    riskLevel: 'Unassessed',
    status: 'Demo Only',
    findingCount: 0,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 0,
    tags: ['Infosec', 'SOC2', 'Penetration Testing'],
  },
  {
    id: 'sla-vertex-ai-2026',
    name: 'AI Model Hosting & API SLA',
    type: 'Service Level Agreement',
    vendor: 'Vertex AI Labs LLC',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-02-18',
    effectiveDate: '2026-03-01',
    riskLevel: 'Unassessed',
    status: 'Demo Only',
    findingCount: 0,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 0,
    tags: ['AI Infrastructure', '99.9% Uptime', 'LLM API'],
  },
  {
    id: 'dpa-cloudscale-2026',
    name: 'Data Processing Addendum (GDPR / CCPA)',
    type: 'Data Privacy Agreement',
    vendor: 'CloudScale Systems Inc.',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-02-24',
    effectiveDate: '2026-02-28',
    riskLevel: 'Unassessed',
    status: 'Demo Only',
    findingCount: 0,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 0,
    tags: ['GDPR', 'Standard Contractual Clauses', 'Privacy'],
  },
  {
    id: 'nda-meridian-2026',
    name: 'Mutual Non-Disclosure Agreement',
    type: 'Confidentiality Agreement',
    vendor: 'Meridian Capital Partners LLC',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-01-15',
    effectiveDate: '2026-01-20',
    riskLevel: 'Unassessed',
    status: 'Demo Only',
    findingCount: 0,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 0,
    tags: ['M&A', 'Due Diligence', 'Confidentiality'],
  },
];

const initialActivities: ActivityLogItem[] = [
  {
    id: 'act-1',
    documentId: 'msa-northwind-brightline-2026',
    documentName: 'Master Services Agreement',
    type: 'system',
    title: 'Sample MSA Findings Loaded',
    description: `${initialFindings.length} findings identified across ${initialContract.sections.length} sections.`,
    author: 'AI Review Agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    severity: 'high',
  },
];

const defaultSettings: UserSettings = {
  reviewerName: 'Sarah Chen',
  reviewerRole: 'Senior Legal Operations Counsel',
  email: 'schen@northwind.io',
  department: 'Legal & Risk Operations',
  theme: 'light',
  emailNotifications: true,
  highRiskAlerts: true,
  autoSaveReviewDrafts: true,
  exportFormat: 'markdown',
};

function sanitizeUserSettings(
  value: unknown,
  defaults: UserSettings
): UserSettings {
  if (!isRecord(value)) return defaults;
  return {
    reviewerName:
      typeof value.reviewerName === 'string'
        ? value.reviewerName
        : defaults.reviewerName,
    reviewerRole:
      typeof value.reviewerRole === 'string'
        ? value.reviewerRole
        : defaults.reviewerRole,
    email: typeof value.email === 'string' ? value.email : defaults.email,
    department:
      typeof value.department === 'string'
        ? value.department
        : defaults.department,
    theme:
      value.theme === 'light' || value.theme === 'dark' || value.theme === 'system'
        ? value.theme
        : defaults.theme,
    emailNotifications:
      typeof value.emailNotifications === 'boolean'
        ? value.emailNotifications
        : defaults.emailNotifications,
    highRiskAlerts:
      typeof value.highRiskAlerts === 'boolean'
        ? value.highRiskAlerts
        : defaults.highRiskAlerts,
    autoSaveReviewDrafts:
      typeof value.autoSaveReviewDrafts === 'boolean'
        ? value.autoSaveReviewDrafts
        : defaults.autoSaveReviewDrafts,
    exportFormat:
      value.exportFormat === 'markdown' ||
      value.exportFormat === 'json' ||
      value.exportFormat === 'pdf'
        ? value.exportFormat
        : defaults.exportFormat,
  };
}

function sanitizeDocument(value: unknown): DocumentItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.vendor !== 'string' ||
    typeof value.counterparty !== 'string' ||
    typeof value.uploadDate !== 'string' ||
    typeof value.effectiveDate !== 'string'
  ) {
    return null;
  }
  const riskLevels: DocumentRiskLevel[] = [
    'Critical',
    'High',
    'Moderate',
    'Low',
    'Unassessed',
  ];
  const statuses: DocumentReviewStatus[] = [
    'Pending Review',
    'In Progress',
    'Completed',
    'Demo Only',
  ];
  const count = (countValue: unknown) =>
    typeof countValue === 'number' && Number.isFinite(countValue) && countValue >= 0
      ? countValue
      : 0;

  return {
    id: value.id,
    name: value.name,
    type: value.type,
    vendor: value.vendor,
    counterparty: value.counterparty,
    uploadDate: value.uploadDate,
    effectiveDate: value.effectiveDate,
    riskLevel: riskLevels.includes(value.riskLevel as DocumentRiskLevel)
      ? (value.riskLevel as DocumentRiskLevel)
      : 'Unassessed',
    status: statuses.includes(value.status as DocumentReviewStatus)
      ? (value.status as DocumentReviewStatus)
      : 'Demo Only',
    findingCount: count(value.findingCount),
    acceptedCount: count(value.acceptedCount),
    dismissedCount: count(value.dismissedCount),
    pendingCount: count(value.pendingCount),
    ...(value.id === initialContract.id ? { isPrimary: true } : {}),
    ...(typeof value.fileSize === 'string' ? { fileSize: value.fileSize } : {}),
    ...(Array.isArray(value.tags)
      ? { tags: value.tags.filter((tag): tag is string => typeof tag === 'string') }
      : {}),
  };
}

function sanitizeActivity(value: unknown): ActivityLogItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.documentId !== 'string' ||
    typeof value.documentName !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.author !== 'string' ||
    typeof value.timestamp !== 'string' ||
    !['accept', 'dismiss', 'note', 'amend', 'upload', 'revert', 'system'].includes(
      value.type as string
    )
  ) {
    return null;
  }
  const severity =
    value.severity === 'high' ||
    value.severity === 'medium' ||
    value.severity === 'low'
      ? value.severity
      : undefined;
  return {
    id: value.id,
    documentId: value.documentId,
    documentName: value.documentName,
    type: value.type as ActivityLogItem['type'],
    title: value.title,
    description: value.description,
    author: value.author,
    timestamp: value.timestamp,
    ...(severity ? { severity } : {}),
  };
}

function sanitizeDocuments(
  value: unknown,
  fallback: DocumentItem[]
): DocumentItem[] {
  const parsed = Array.isArray(value)
    ? value
        .map(sanitizeDocument)
        .filter((document): document is DocumentItem => document !== null)
    : fallback;
  const canonicalDocuments = parsed.map((document) =>
    document.id === initialContract.id
      ? initialDocuments[0]
      : { ...document, isPrimary: false }
  );
  const uniqueDocuments = Array.from(
    new Map(canonicalDocuments.map((document) => [document.id, document])).values()
  );
  return uniqueDocuments.some((document) => document.id === initialContract.id)
    ? uniqueDocuments
    : [initialDocuments[0], ...uniqueDocuments];
}

function sanitizeActivityLog(
  value: unknown,
  fallback: ActivityLogItem[]
): ActivityLogItem[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map(sanitizeActivity)
    .filter(
      (activity): activity is ActivityLogItem =>
        activity !== null &&
        (activity.documentId === initialContract.id || activity.type === 'upload')
    )
    .map((activity) =>
      activity.documentId === initialContract.id
        ? { ...activity, documentName: initialDocuments[0].name }
        : activity
    );
}

export const useReviewStore = create<ReviewStoreState>()(
  persist(
    (set, get) => ({
      contract: cloneContract(initialContract),
      originalParagraphs: {},
      findings: initialFindings,
      agentMeta: {
        name: initialFindingsDataset.agent?.name || 'Contract Review Agent',
        version: initialFindingsDataset.agent?.version || '2.3.1',
        generatedAt: initialFindingsDataset.generatedAt,
      },
      reviews: {},
      selectedFindingId: initialFindings[0]?.id || null,
      highlightedParagraphId: null,
      filters: defaultFilters,
      zenMode: false,
      showSummaryModal: false,
      showShortcutsModal: false,

      // Multi-page platform state
      documents: initialDocuments,
      activityLog: initialActivities,
      userSettings: defaultSettings,

      selectFinding: (findingId, highlightParagraph) => {
        set({
          selectedFindingId: findingId,
          highlightedParagraphId: highlightParagraph ?? null,
        });
      },

      logActivity: (item) => {
        const newActivity: ActivityLogItem = {
          ...item,
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activityLog: [newActivity, ...state.activityLog.slice(0, 49)], // keep last 50
        }));
      },

      setStatus: (findingId, status) => {
        if (
          status !== 'accepted' &&
          get().reviews[findingId]?.isEditApplied
        ) {
          get().revertSuggestedEdit(findingId);
        }

        const state = get();
        const finding = state.findings.find((f) => f.id === findingId);
        const previousReview = state.reviews[findingId];
        if (previousReview?.status === status) return;

        set((state) => {
          const currentReview = state.reviews[findingId] || {
            status: 'pending',
            notes: [],
          };
          return {
            reviews: {
              ...state.reviews,
              [findingId]: {
                ...currentReview,
                status,
                editError: undefined,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });

        if (finding && status !== 'pending') {
          get().logActivity({
            documentId: 'msa-northwind-brightline-2026',
            documentName: 'Master Services Agreement',
            type: status === 'accepted' ? 'accept' : 'dismiss',
            title:
              status === 'accepted'
                ? `Accepted Finding #${finding.id}`
                : `Dismissed Finding #${finding.id}`,
            description: `${finding.title} (${finding.severity.toUpperCase()} Risk)`,
            author: get().userSettings.reviewerName,
            severity: finding.severity,
          });
        }
      },

      addNote: (findingId, text, author) => {
        if (!text.trim()) return;
        const currentAuthor = author || get().userSettings.reviewerName;
        const finding = get().findings.find((f) => f.id === findingId);

        set((state) => {
          const currentReview = state.reviews[findingId] || {
            status: 'pending',
            notes: [],
          };
          const newNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            author: currentAuthor,
            text: text.trim(),
            timestamp: new Date().toISOString(),
          };
          return {
            reviews: {
              ...state.reviews,
              [findingId]: {
                ...currentReview,
                notes: [...currentReview.notes, newNote],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });

        if (finding) {
          get().logActivity({
            documentId: 'msa-northwind-brightline-2026',
            documentName: 'Master Services Agreement',
            type: 'note',
            title: `Added Note on #${finding.id}`,
            description: text.length > 60 ? `${text.slice(0, 60)}...` : text,
            author: currentAuthor,
            severity: finding.severity,
          });
        }
      },

      deleteNote: (findingId, noteId) => {
        set((state) => {
          const currentReview = state.reviews[findingId];
          if (!currentReview) return state;
          return {
            reviews: {
              ...state.reviews,
              [findingId]: {
                ...currentReview,
                notes: currentReview.notes.filter((n) => n.id !== noteId),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      applySuggestedEdit: (findingId) => {
        const state = get();
        const finding = state.findings.find((f) => f.id === findingId);
        if (!finding || finding.suggestedEdit === null) return false;

        const currentReview = state.reviews[findingId] || {
          status: 'pending',
          notes: [],
        };
        if (currentReview.isEditApplied) return true;

        const setEditError = (message: string) => {
          set((currentState) => ({
            reviews: {
              ...currentState.reviews,
              [findingId]: {
                ...(currentState.reviews[findingId] || {
                  status: 'pending',
                  notes: [],
                }),
                editError: message,
              },
            },
          }));
        };

        const candidateReviews = {
          ...state.reviews,
          [findingId]: {
            ...currentReview,
            isEditApplied: true,
          },
        };
        const operations: TextEditOperation[] = [];

        for (const candidate of state.findings) {
          if (!candidateReviews[candidate.id]?.isEditApplied) continue;
          const candidateOperations = buildFindingEditOperations(
            candidate,
            state.contract.sections.flatMap((section) => section.paragraphs),
            state.originalParagraphs
          );
          if (!candidateOperations) {
            setEditError(
              'The original clause could not be located. No changes were applied.'
            );
            return false;
          }
          operations.push(...candidateOperations);
        }

        if (hasConflictingEdits(operations)) {
          setEditError(
            'This amendment overlaps another applied edit. Revert that edit before applying this one.'
          );
          return false;
        }

        const originalParagraphs = { ...state.originalParagraphs };
        const affectedParagraphs = new Set(
          operations.map((operation) => operation.paragraphId)
        );
        for (const paragraphId of affectedParagraphs) {
          if (originalParagraphs[paragraphId] !== undefined) continue;
          for (const section of state.contract.sections) {
            const paragraph = section.paragraphs.find(
              (item) => item.id === paragraphId
            );
            if (paragraph) {
              originalParagraphs[paragraphId] = paragraph.text;
              break;
            }
          }
        }

        const contract = applyTextEditOperations(
          state.contract,
          originalParagraphs,
          operations,
          affectedParagraphs
        );

        set({
          contract,
          originalParagraphs,
          reviews: {
            ...state.reviews,
            [findingId]: {
              ...currentReview,
              isEditApplied: true,
              appliedText: finding.suggestedEdit,
              editError: undefined,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        get().logActivity({
          documentId: 'msa-northwind-brightline-2026',
          documentName: 'Master Services Agreement',
          type: 'amend',
          title: `Applied Redline Amendment on #${finding.id}`,
          description: `Contract text § ${finding.anchor?.paragraphId.replace('p-', '') ?? 'Document-Wide'} amended with proposed replacement.`,
          author: get().userSettings.reviewerName,
          severity: finding.severity,
        });
        return true;
      },

      revertSuggestedEdit: (findingId) => {
        const state = get();
        const finding = state.findings.find((f) => f.id === findingId);
        if (!finding) return;
        const currentReview = state.reviews[findingId];
        if (!currentReview?.isEditApplied) return;

        const reviews = {
          ...state.reviews,
          [findingId]: {
            ...currentReview,
            isEditApplied: false,
            appliedText: undefined,
            editError: undefined,
            updatedAt: new Date().toISOString(),
          },
        };
        const affectedParagraphs = new Set(
          Object.keys(state.originalParagraphs)
        );
        const remainingOperations: TextEditOperation[] = [];
        for (const candidate of state.findings) {
          if (!reviews[candidate.id]?.isEditApplied) continue;
          const candidateOperations = buildFindingEditOperations(
            candidate,
            state.contract.sections.flatMap((section) => section.paragraphs),
            state.originalParagraphs
          );
          if (candidateOperations) remainingOperations.push(...candidateOperations);
        }

        const contract = applyTextEditOperations(
          state.contract,
          state.originalParagraphs,
          remainingOperations,
          affectedParagraphs
        );
        const originalParagraphs = { ...state.originalParagraphs };
        for (const paragraphId of affectedParagraphs) {
          if (
            !remainingOperations.some(
              (operation) => operation.paragraphId === paragraphId
            )
          ) {
            delete originalParagraphs[paragraphId];
          }
        }

        set({
          contract,
          originalParagraphs,
          reviews,
        });

        get().logActivity({
          documentId: 'msa-northwind-brightline-2026',
          documentName: 'Master Services Agreement',
          type: 'revert',
          title: `Reverted Amendment on #${finding.id}`,
          description: `Original text restored for § ${finding.anchor?.paragraphId.replace('p-', '') ?? 'Document-Wide'}.`,
          author: get().userSettings.reviewerName,
          severity: finding.severity,
        });
      },

      setFilter: (key, value) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      resetAllReviews: () => {
        set({
          contract: cloneContract(initialContract),
          originalParagraphs: {},
          reviews: {},
          selectedFindingId: initialFindings[0]?.id || null,
          highlightedParagraphId: null,
          filters: defaultFilters,
        });

        get().logActivity({
          documentId: 'msa-northwind-brightline-2026',
          documentName: 'Master Services Agreement',
          type: 'revert',
          title: 'Review Progress Reset',
          description: 'All reviews, notes, and amendments were reset to initial state.',
          author: get().userSettings.reviewerName,
        });
      },

      setZenMode: (enabled) => set({ zenMode: enabled }),
      toggleSummaryModal: (open) =>
        set((state) => ({
          showSummaryModal: open !== undefined ? open : !state.showSummaryModal,
        })),
      toggleShortcutsModal: (open) =>
        set((state) => ({
          showShortcutsModal: open !== undefined ? open : !state.showShortcutsModal,
        })),

      addDocument: (doc) => {
        set((state) => ({
          documents: [doc, ...state.documents],
        }));
        get().logActivity({
          documentId: doc.id,
          documentName: doc.name,
          type: 'upload',
          title: `Uploaded New Contract: ${doc.name}`,
          description: `Vendor: ${doc.vendor} • Size: ${doc.fileSize || 'N/A'}`,
          author: get().userSettings.reviewerName,
        });
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
      },

      updateUserSettings: (newSettings) => {
        set((state) => ({
          userSettings: {
            ...state.userSettings,
            ...newSettings,
          },
        }));
      },

      getDynamicDocuments: () => {
        const { documents, reviews, findings } = get();
        const analytics = calculateRiskAnalytics(get().contract, findings, reviews);
        // Compute live metrics for primary MSA contract
        let accepted = 0;
        let dismissed = 0;
        let pending = 0;

        findings.forEach((f) => {
          const rev = reviews[f.id];
          if (rev?.status === 'accepted') accepted++;
          else if (rev?.status === 'dismissed') dismissed++;
          else pending++;
        });

        const totalReviewed = accepted + dismissed;
        const total = findings.length;

        let status: DocumentItem['status'] = 'Pending Review';
        if (total > 0 && totalReviewed === total) status = 'Completed';
        else if (totalReviewed > 0) status = 'In Progress';

        return documents.map((doc) => {
          if (doc.isPrimary && doc.id === initialContract.id) {
            return {
              ...doc,
              acceptedCount: accepted,
              dismissedCount: dismissed,
              pendingCount: pending,
              status,
              riskLevel: analytics.riskLevel,
            };
          }
          return {
            ...doc,
            isPrimary: false,
            acceptedCount: 0,
            dismissedCount: 0,
            pendingCount: 0,
            findingCount: 0,
            riskLevel: 'Unassessed',
            status: 'Demo Only',
            fileSize: undefined,
          };
        });
      },

      getFilteredFindings: () => {
        const { findings, filters, reviews } = get();

        return findings.filter((f) => {
          if (filters.severity !== 'all' && f.severity !== filters.severity) {
            return false;
          }
          if (filters.category !== 'all' && f.category !== filters.category) {
            return false;
          }
          const status = reviews[f.id]?.status || 'pending';
          if (filters.status !== 'all' && status !== filters.status) {
            return false;
          }
          if (filters.search.trim()) {
            const query = filters.search.toLowerCase();
            const matchTitle = f.title.toLowerCase().includes(query);
            const matchExplanation = f.explanation.toLowerCase().includes(query);
            const matchCategory = f.category.toLowerCase().includes(query);
            const matchQuote = f.anchor?.quote.toLowerCase().includes(query) || false;
            if (!matchTitle && !matchExplanation && !matchCategory && !matchQuote) {
              return false;
            }
          }
          return true;
        }).sort((a, b) => {
          if (filters.sort === 'severity-desc') {
            const weight = { high: 3, medium: 2, low: 1 };
            return weight[b.severity] - weight[a.severity];
          }
          if (filters.sort === 'confidence-desc') {
            return b.confidence - a.confidence;
          }
          if (filters.sort === 'status') {
            const statusA = reviews[a.id]?.status || 'pending';
            const statusB = reviews[b.id]?.status || 'pending';
            return statusA.localeCompare(statusB);
          }
          return 0;
        });
      },

      nextFinding: () => {
        const filtered = get().getFilteredFindings();
        if (filtered.length === 0) return;

        const currentId = get().selectedFindingId;
        const currentIndex = filtered.findIndex((f) => f.id === currentId);
        const nextIndex =
          currentIndex === -1 ? 0 : (currentIndex + 1) % filtered.length;
        const nextFinding = filtered[nextIndex];

        set({
          selectedFindingId: nextFinding.id,
          highlightedParagraphId: nextFinding.anchor?.paragraphId || null,
        });
      },

      prevFinding: () => {
        const filtered = get().getFilteredFindings();
        if (filtered.length === 0) return;

        const currentId = get().selectedFindingId;
        const currentIndex = filtered.findIndex((f) => f.id === currentId);
        const prevIndex =
          currentIndex === -1
            ? filtered.length - 1
            : (currentIndex - 1 + filtered.length) % filtered.length;
        const prevFinding = filtered[prevIndex];

        set({
          selectedFindingId: prevFinding.id,
          highlightedParagraphId: prevFinding.anchor?.paragraphId || null,
        });
      },
    }),
    {
      name: 'northwind_ai_document_review_v1',
      partialize: (state) => ({
        ...(state.userSettings.autoSaveReviewDrafts
          ? {
              contract: state.contract,
              reviews: state.reviews,
              originalParagraphs: state.originalParagraphs,
            }
          : {}),
        zenMode: state.zenMode,
        documents: state.documents,
        activityLog: state.activityLog,
        userSettings: state.userSettings,
      }),
      version: 2,
      migrate: (persistedState, version) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        const userSettings = sanitizeUserSettings(
          persisted.userSettings,
          defaultSettings
        );
        let reviews = userSettings.autoSaveReviewDrafts
          ? sanitizeReviews(persisted.reviews, initialFindings)
          : {};
        if (version < 2) {
          reviews = Object.fromEntries(
            Object.entries(reviews).map(([findingId, review]) => [
              findingId,
              review.isEditApplied && review.status === 'accepted'
                ? { ...review, status: 'pending' }
                : review,
            ])
          );
        }
        const originals = userSettings.autoSaveReviewDrafts
          ? sanitizeOriginalParagraphs(
              persisted.originalParagraphs,
              initialContract
            )
          : {};
        const restoredDraft = restoreReviewDraft(
          cloneContract(initialContract),
          initialFindings,
          reviews,
          originals
        );
        const documents = sanitizeDocuments(
          persisted.documents,
          initialDocuments
        );
        const activityLog = sanitizeActivityLog(
          persisted.activityLog,
          initialActivities
        );

        return {
          ...restoredDraft,
          zenMode:
            typeof persisted.zenMode === 'boolean' ? persisted.zenMode : false,
          documents,
          activityLog,
          userSettings,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error(
            'Unable to restore saved review data. Default review state is active.',
            error
          );
        }
      },
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        const userSettings = sanitizeUserSettings(
          persisted.userSettings,
          currentState.userSettings
        );
        const autosaveEnabled = userSettings.autoSaveReviewDrafts;
        const reviews = autosaveEnabled
          ? sanitizeReviews(persisted.reviews, initialFindings)
          : {};
        const savedOriginalParagraphs = autosaveEnabled
          ? sanitizeOriginalParagraphs(
              persisted.originalParagraphs,
              initialContract
            )
          : {};
        const restoredDraft = restoreReviewDraft(
          cloneContract(initialContract),
          initialFindings,
          reviews,
          savedOriginalParagraphs
        );

        const documents = sanitizeDocuments(
          persisted.documents,
          currentState.documents
        );
        const activityLog = sanitizeActivityLog(
          persisted.activityLog,
          currentState.activityLog
        );

        return {
          ...currentState,
          ...restoredDraft,
          reviews: restoredDraft.reviews,
          documents,
          activityLog,
          userSettings,
          zenMode:
            typeof persisted.zenMode === 'boolean'
              ? persisted.zenMode
              : currentState.zenMode,
        };
      },
    }
  )
);
