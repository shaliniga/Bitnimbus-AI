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
import type { DocumentItem, ActivityLogItem } from '../types/document';
import { normalizeText, resolveAnchorRange } from '../utils/textMatcher';
import { calculateRiskAnalytics } from '../utils/riskCalculator';

import initialContractData from '../assets/sample-contract.json';
import initialFindingsData from '../assets/findings.json';

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

interface TextEditOperation {
  findingId: string;
  paragraphId: string;
  start: number;
  end: number;
  replacement: string;
}

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

function buildFindingEditOperations(
  finding: Finding,
  contract: ContractDocument,
  originalParagraphs: Record<string, string>
): TextEditOperation[] | null {
  const anchor = finding.anchor;
  if (!anchor || finding.suggestedEdit === null) return null;

  const paragraphs = contract.sections.flatMap((section) => section.paragraphs);
  const startIndex = paragraphs.findIndex(
    (paragraph) => paragraph.id === anchor.paragraphId
  );
  if (startIndex === -1) return null;

  const startParagraph = paragraphs[startIndex];
  const startText =
    originalParagraphs[startParagraph.id] ?? startParagraph.text;

  if (anchor.endParagraphId && anchor.endParagraphId !== anchor.paragraphId) {
    const endIndex = paragraphs.findIndex(
      (paragraph) => paragraph.id === anchor.endParagraphId
    );
    if (endIndex <= startIndex) return null;

    const endParagraph = paragraphs[endIndex];
    const endText = originalParagraphs[endParagraph.id] ?? endParagraph.text;
    if (
      !Number.isInteger(anchor.start) ||
      !Number.isInteger(anchor.end) ||
      anchor.start < 0 ||
      anchor.start > startText.length ||
      anchor.end < 0 ||
      anchor.end > endText.length
    ) {
      return null;
    }

    const matchedText = [
      startText.slice(anchor.start),
      ...paragraphs
        .slice(startIndex + 1, endIndex)
        .map((paragraph) => originalParagraphs[paragraph.id] ?? paragraph.text),
      endText.slice(0, anchor.end),
    ].join(' ');
    if (normalizeText(matchedText) !== normalizeText(anchor.quote)) return null;

    const operations: TextEditOperation[] = [
      {
        findingId: finding.id,
        paragraphId: startParagraph.id,
        start: anchor.start,
        end: startText.length,
        replacement: finding.suggestedEdit,
      },
    ];

    for (const paragraph of paragraphs.slice(startIndex + 1, endIndex)) {
      const paragraphText =
        originalParagraphs[paragraph.id] ?? paragraph.text;
      operations.push({
        findingId: finding.id,
        paragraphId: paragraph.id,
        start: 0,
        end: paragraphText.length,
        replacement: '',
      });
    }

    operations.push({
      findingId: finding.id,
      paragraphId: endParagraph.id,
      start: 0,
      end: anchor.end,
      replacement: '',
    });
    return operations;
  }

  const range = resolveAnchorRange(
    startText,
    anchor.start,
    anchor.end,
    anchor.quote
  );
  if (!range.exact || range.start === range.end) return null;

  return [
    {
      findingId: finding.id,
      paragraphId: startParagraph.id,
      start: range.start,
      end: range.end,
      replacement: finding.suggestedEdit,
    },
  ];
}

function hasConflictingEdits(operations: TextEditOperation[]): boolean {
  for (let index = 0; index < operations.length; index++) {
    for (let otherIndex = index + 1; otherIndex < operations.length; otherIndex++) {
      const current = operations[index];
      const other = operations[otherIndex];
      if (
        current.findingId !== other.findingId &&
        current.paragraphId === other.paragraphId &&
        current.start < other.end &&
        other.start < current.end
      ) {
        return true;
      }
    }
  }
  return false;
}

function applyTextEditOperations(
  contract: ContractDocument,
  originalParagraphs: Record<string, string>,
  operations: TextEditOperation[],
  affectedParagraphs: Set<string>
): ContractDocument {
  const operationsByParagraph = new Map<string, TextEditOperation[]>();
  for (const operation of operations) {
    const paragraphOperations =
      operationsByParagraph.get(operation.paragraphId) || [];
    paragraphOperations.push(operation);
    operationsByParagraph.set(operation.paragraphId, paragraphOperations);
  }

  return {
    ...contract,
    sections: contract.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph) => {
        if (!affectedParagraphs.has(paragraph.id)) return { ...paragraph };

        let text = originalParagraphs[paragraph.id] ?? paragraph.text;
        const paragraphOperations = operationsByParagraph.get(paragraph.id) || [];
        for (const operation of [...paragraphOperations].sort(
          (a, b) => b.start - a.start
        )) {
          text =
            text.slice(0, operation.start) +
            operation.replacement +
            text.slice(operation.end);
        }
        return { ...paragraph, text };
      }),
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
    fileSize: '2.4 MB',
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
    riskLevel: 'Critical',
    status: 'Pending Review',
    findingCount: 19,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 19,
    fileSize: '1.8 MB',
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
    riskLevel: 'High',
    status: 'In Progress',
    findingCount: 14,
    acceptedCount: 5,
    dismissedCount: 3,
    pendingCount: 6,
    fileSize: '1.2 MB',
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
    riskLevel: 'Moderate',
    status: 'Completed',
    findingCount: 8,
    acceptedCount: 7,
    dismissedCount: 1,
    pendingCount: 0,
    fileSize: '950 KB',
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
    riskLevel: 'Low',
    status: 'Completed',
    findingCount: 3,
    acceptedCount: 2,
    dismissedCount: 1,
    pendingCount: 0,
    fileSize: '420 KB',
    tags: ['M&A', 'Due Diligence', 'Confidentiality'],
  },
];

const initialActivities: ActivityLogItem[] = [
  {
    id: 'act-1',
    documentId: 'msa-northwind-brightline-2026',
    documentName: 'Master Services Agreement',
    type: 'amend',
    title: 'AI Contract Review Generated',
    description: `${initialFindings.length} findings identified across ${initialContract.sections.length} sections.`,
    author: 'AI Review Agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    severity: 'high',
  },
  {
    id: 'act-2',
    documentId: 'dpa-cloudscale-2026',
    documentName: 'Data Processing Addendum',
    type: 'accept',
    title: 'Review Finalized & Approved',
    description: '7 privacy amendments accepted, 1 low-risk clause dismissed.',
    author: 'Sarah Chen (Lead Counsel)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    severity: 'low',
  },
  {
    id: 'act-3',
    documentId: 'sla-vertex-ai-2026',
    documentName: 'AI Model Hosting SLA',
    type: 'note',
    title: 'Uptime Remedy Flagged',
    description: 'Added negotiation note regarding 99.9% monthly availability credits.',
    author: 'Marcus Vance (Legal Ops)',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    severity: 'medium',
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
            state.contract,
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
              status: 'accepted',
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
            state.contract,
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
          if (doc.isPrimary) {
            return {
              ...doc,
              acceptedCount: accepted,
              dismissedCount: dismissed,
              pendingCount: pending,
              status,
              riskLevel: analytics.riskLevel,
            };
          }
          return doc;
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
      version: 1,
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<ReviewStoreState>;
        if (version >= 1) return persisted as ReviewStoreState;

        const reviews = { ...(persisted.reviews || {}) };
        const originalParagraphs = {
          ...(persisted.originalParagraphs || {}),
        };
        if (persisted.userSettings?.autoSaveReviewDrafts === false) {
          return {
            ...persisted,
            contract: cloneContract(initialContract),
            reviews: {},
            originalParagraphs: {},
          } as ReviewStoreState;
        }

        const contract = cloneContract(initialContract);
        const operations: TextEditOperation[] = [];
        for (const finding of initialFindings) {
          if (!reviews[finding.id]?.isEditApplied) continue;
          const findingOperations = buildFindingEditOperations(
            finding,
            contract,
            originalParagraphs
          );
          if (
            !findingOperations ||
            hasConflictingEdits([...operations, ...findingOperations])
          ) {
            reviews[finding.id] = {
              ...reviews[finding.id],
              isEditApplied: false,
              appliedText: undefined,
              editError:
                'This saved amendment could not be restored because its clause is missing or overlaps another edit.',
            };
            continue;
          }
          operations.push(...findingOperations);
        }

        const affectedParagraphs = new Set(
          operations.map((operation) => operation.paragraphId)
        );
        for (const paragraphId of affectedParagraphs) {
          if (originalParagraphs[paragraphId] !== undefined) continue;
          for (const section of contract.sections) {
            const paragraph = section.paragraphs.find(
              (item) => item.id === paragraphId
            );
            if (paragraph) {
              originalParagraphs[paragraphId] = paragraph.text;
              break;
            }
          }
        }

        return {
          ...persisted,
          contract: applyTextEditOperations(
            contract,
            originalParagraphs,
            operations,
            affectedParagraphs
          ),
          reviews,
          originalParagraphs,
        } as ReviewStoreState;
      },
    }
  )
);
